import "server-only";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { TAXONOMY_VERSION } from "@/domain/taxonomy";
import { scoreClassification, type DomainCoverage, type ScoreBandId } from "@/domain/xray/scoring";
import { buildUpgradeLines } from "@/domain/xray/prompt-upgrade";
import type { XRayOwnerResult, XRaySharedSummary } from "@/domain/xray/result";
import { AiError } from "../ai/types";
import { XRAY_MAX_PROMPT_CHARS, XRAY_PROMPT_VERSION, xrayClassifyFeature } from "../ai/features/xray-classify";
import type { AppContext } from "../context";
import { xrayRuns } from "../db/schema";
import { recordEvent } from "../events";
import { hmac, normalizePrompt, randomToken, safeEqual, sha256, shareSlug } from "../security/crypto";
import { hitRateLimit } from "../security/rate-limit";
import { ServiceError } from "./errors";

export const XRAY_MIN_PROMPT_CHARS = 20;

export const XRayRequestSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(XRAY_MIN_PROMPT_CHARS, `Write at least ${XRAY_MIN_PROMPT_CHARS} characters so there is something to analyse.`)
    .max(XRAY_MAX_PROMPT_CHARS, `Keep it under ${XRAY_MAX_PROMPT_CHARS.toLocaleString("en-US")} characters.`),
});

export const OwnerActionSchema = z.object({
  runId: z.uuid(),
  ownerToken: z.string().min(20).max(100),
});

/**
 * Runs a Prompt X-Ray. The raw prompt exists only inside this function call: it is sent to
 * the classifier, HMAC'd for the cache key, and dropped. Nothing derived from it as text is
 * stored or returned (tests/server/xray-service.test.ts asserts this).
 */
export async function runXRay(ctx: AppContext, input: { prompt: unknown; clientIp: string }): Promise<XRayOwnerResult> {
  if (!ctx.config.features.xray) throw new ServiceError("feature_disabled", "The Prompt X-Ray is paused right now. Please try again later.");

  const parsed = XRayRequestSchema.safeParse({ prompt: input.prompt });
  if (!parsed.success) throw new ServiceError("invalid_input", parsed.error.issues[0]?.message ?? "Invalid prompt.");
  const prompt = parsed.data.prompt;

  const subject = hmac(ctx.config.hashSecret, "subject", input.clientIp);
  const now = ctx.now();
  const perMinute = await hitRateLimit(ctx.db, `xray:m:${subject}`, { windowSeconds: 60, limit: ctx.config.limits.xrayPerMinute, now });
  if (!perMinute.allowed) {
    throw new ServiceError("rate_limited", "That is a lot of X-Rays in a minute. Wait a moment and try again.", { retryAfterSeconds: perMinute.retryAfterSeconds });
  }
  const perDay = await hitRateLimit(ctx.db, `xray:d:${subject}`, { windowSeconds: 86_400, limit: ctx.config.limits.xrayPerDay, now });
  if (!perDay.allowed) {
    throw new ServiceError("rate_limited", `You have used today's ${perDay.limit} free X-Rays. They reset at 00:00 UTC.`, { retryAfterSeconds: perDay.retryAfterSeconds });
  }

  const promptHmac = hmac(ctx.config.hashSecret, "prompt", normalizePrompt(prompt));

  let classified;
  try {
    classified = await ctx.ai.run(xrayClassifyFeature, { prompt }, { cacheKey: promptHmac });
  } catch (error) {
    await recordEvent(ctx.db, "xray_failed", { reason: error instanceof AiError ? error.code : "unknown" });
    throw toServiceError(error);
  }

  const c = classified.output;
  const score = scoreClassification(c);
  const upgradeLines = buildUpgradeLines(score);
  const mode = classified.provider === "simulated" ? "simulated" : "ai";
  const runId = randomUUID();
  const ownerToken = randomToken();
  const createdAt = ctx.now();

  await ctx.db.insert(xrayRuns).values({
    id: runId,
    createdAt,
    promptHmac,
    promptChars: prompt.length,
    subjectHmac: subject,
    ownerTokenHash: sha256(ownerToken),
    mode,
    model: classified.model,
    cached: classified.cached,
    taxonomyVersion: TAXONOMY_VERSION,
    scoringVersion: score.version,
    promptVersion: XRAY_PROMPT_VERSION,
    isSoftwareRequest: c.isSoftwareRequest,
    appType: c.appType,
    language: c.language,
    traits: c.traits,
    statuses: c.statuses,
    score: score.score,
    uncappedScore: score.uncappedScore,
    band: score.band,
    silentCount: score.silentCount,
    partialCount: score.partialCount,
    addressedCount: score.addressedCount,
    applicableCount: score.applicableCount,
    domains: score.domains,
    topRisks: score.topRisks,
    criticalMissing: score.cap.criticalMissing,
    capApplied: score.cap.applied,
  });

  await recordEvent(ctx.db, "xray_completed", { mode, band: score.band, cached: classified.cached });

  return {
    runId,
    ownerToken,
    createdAt: createdAt.toISOString(),
    score: score.score,
    uncappedScore: score.uncappedScore,
    band: score.band,
    silentCount: score.silentCount,
    partialCount: score.partialCount,
    addressedCount: score.addressedCount,
    applicableCount: score.applicableCount,
    capApplied: score.cap.applied,
    criticalMissing: score.cap.criticalMissing,
    domains: score.domains,
    topRisks: score.topRisks,
    assessments: score.assessments,
    upgradeLines,
    mode,
    model: mode === "ai" ? classified.model : null,
    cached: classified.cached,
    isSoftwareRequest: c.isSoftwareRequest,
    appType: c.appType,
    traits: c.traits,
    language: c.language,
    taxonomyVersion: TAXONOMY_VERSION,
    scoringVersion: score.version,
  };
}

function toServiceError(error: unknown): ServiceError {
  if (error instanceof ServiceError) return error;
  if (error instanceof AiError) {
    switch (error.code) {
      case "budget_exhausted":
        return new ServiceError("budget_exhausted", error.message);
      case "provider_disabled":
        return new ServiceError("analysis_unavailable", "Prompt analysis is not configured on this server yet.");
      case "refused":
        return new ServiceError("invalid_input", "This prompt could not be analysed. Describe the software you want to build.");
      default:
        return new ServiceError("upstream_error", "The analysis service had a problem. Try again in a minute.");
    }
  }
  return new ServiceError("upstream_error", "Something went wrong while analysing. Try again in a minute.");
}

async function findOwnedRun(ctx: AppContext, input: unknown) {
  const parsed = OwnerActionSchema.safeParse(input);
  if (!parsed.success) throw new ServiceError("invalid_input", "That link is not valid.");
  const [run] = await ctx.db
    .select({ id: xrayRuns.id, ownerTokenHash: xrayRuns.ownerTokenHash, shareSlug: xrayRuns.shareSlug })
    .from(xrayRuns)
    .where(eq(xrayRuns.id, parsed.data.runId))
    .limit(1);
  if (!run) throw new ServiceError("not_found", "This result no longer exists.");
  if (!safeEqual(run.ownerTokenHash, sha256(parsed.data.ownerToken))) {
    throw new ServiceError("forbidden", "Only the person who ran this X-Ray can change it.");
  }
  return run;
}

/** Opt-in sharing: creates (or returns) the public slug. Shares the summary only. */
export async function shareRun(ctx: AppContext, input: unknown): Promise<{ slug: string; url: string }> {
  const run = await findOwnedRun(ctx, input);
  let slug = run.shareSlug;
  if (!slug) {
    slug = shareSlug();
    await ctx.db.update(xrayRuns).set({ shareSlug: slug, sharedAt: ctx.now() }).where(eq(xrayRuns.id, run.id));
    await recordEvent(ctx.db, "xray_shared");
  }
  return { slug, url: `${ctx.config.siteUrl}/x/${slug}` };
}

export async function unshareRun(ctx: AppContext, input: unknown): Promise<void> {
  const run = await findOwnedRun(ctx, input);
  await ctx.db.update(xrayRuns).set({ shareSlug: null, sharedAt: null }).where(eq(xrayRuns.id, run.id));
  await recordEvent(ctx.db, "xray_unshared");
}

export async function deleteRun(ctx: AppContext, input: unknown): Promise<void> {
  const run = await findOwnedRun(ctx, input);
  await ctx.db.delete(xrayRuns).where(eq(xrayRuns.id, run.id));
  await recordEvent(ctx.db, "xray_deleted");
}

export async function getSharedSummary(ctx: AppContext, slug: string): Promise<XRaySharedSummary | null> {
  if (!/^[a-zA-Z0-9]{6,20}$/.test(slug)) return null;
  const [run] = await ctx.db.select().from(xrayRuns).where(eq(xrayRuns.shareSlug, slug)).limit(1);
  if (!run) return null;
  return {
    score: run.score,
    band: run.band as ScoreBandId,
    silentCount: run.silentCount,
    partialCount: run.partialCount,
    addressedCount: run.addressedCount,
    applicableCount: run.applicableCount,
    capApplied: run.capApplied,
    criticalMissing: run.criticalMissing as string[],
    domains: run.domains as DomainCoverage[],
    topRisks: run.topRisks as string[],
    mode: run.mode,
    taxonomyVersion: run.taxonomyVersion,
    scoringVersion: run.scoringVersion,
    createdAt: run.createdAt.toISOString(),
  };
}

