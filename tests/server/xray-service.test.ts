import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { aiCache, aiUsage, events, xrayRuns } from "@/server/db/schema";
import { deleteRun, getSharedSummary, runXRay, shareRun, unshareRun } from "@/server/services/xray";
import { ServiceError } from "@/server/services/errors";
import { createTestContext, fakeAnthropic } from "../support/test-context";
import { SHOP_PROMPT } from "../support/fixtures";

const IP = "203.0.113.7";

describe("runXRay", () => {
  it("returns a scored, explained result from the rule-based check", async () => {
    const ctx = await createTestContext({ env: { AI_PROVIDER: "rules" } });
    const r = await runXRay(ctx, { prompt: SHOP_PROMPT, clientIp: IP });
    expect(r.mode).toBe("rules");
    expect(r.model).toBeNull();
    expect(r.traits.takesPayments).toBe(true);
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
    expect(r.domains).toHaveLength(12);
    expect(r.topRisks.length).toBeGreaterThan(0);
    expect(r.upgradeLines.length).toBe(r.silentCount + r.partialCount);
    expect(r.ownerToken.length).toBeGreaterThan(20);
  });

  it("labels real-provider results as AI and records the model", async () => {
    const { provider } = fakeAnthropic();
    const ctx = await createTestContext({ provider });
    const r = await runXRay(ctx, { prompt: SHOP_PROMPT, clientIp: IP });
    expect(r.mode).toBe("ai");
    expect(r.model).toBe("claude-haiku-5-5");
  });

  it("never stores or returns the prompt text", async () => {
    const secret = "Quantum pickle subscription for left-handed astronauts with login and Stripe";
    const ctx = await createTestContext({ env: { AI_PROVIDER: "rules" } });
    const result = await runXRay(ctx, { prompt: secret, clientIp: IP });

    expect(JSON.stringify(result).toLowerCase()).not.toContain("astronaut");
    for (const table of [xrayRuns, aiCache, aiUsage, events]) {
      const rows = await ctx.db.select().from(table);
      expect(JSON.stringify(rows).toLowerCase(), "table leaked prompt text").not.toContain("astronaut");
    }
    // Belt and braces: search every text and jsonb column in the database.
    const dump = await ctx.db.execute(sql`select row_to_json(t)::text as j from xray_runs t union all select row_to_json(t)::text from ai_cache t`);
    expect(JSON.stringify(dump).toLowerCase()).not.toContain("pickle");
  });

  it("validates prompt length", async () => {
    const ctx = await createTestContext({ env: { AI_PROVIDER: "rules" } });
    await expect(runXRay(ctx, { prompt: "too short", clientIp: IP })).rejects.toMatchObject({ code: "invalid_input" });
    await expect(runXRay(ctx, { prompt: "x".repeat(4001), clientIp: IP })).rejects.toMatchObject({ code: "invalid_input" });
    await expect(runXRay(ctx, { prompt: 42, clientIp: IP })).rejects.toMatchObject({ code: "invalid_input" });
  });

  it("rate-limits per visitor per minute", async () => {
    const ctx = await createTestContext({ env: { AI_PROVIDER: "rules", XRAY_MINUTE_LIMIT: "2", XRAY_DAILY_LIMIT: "50" } });
    await runXRay(ctx, { prompt: SHOP_PROMPT, clientIp: IP });
    await runXRay(ctx, { prompt: SHOP_PROMPT, clientIp: IP });
    const err = await runXRay(ctx, { prompt: SHOP_PROMPT, clientIp: IP }).catch((e) => e);
    expect(err).toBeInstanceOf(ServiceError);
    expect(err.code).toBe("rate_limited");
    expect(err.retryAfterSeconds).toBeGreaterThan(0);
    // A different visitor is unaffected.
    await expect(runXRay(ctx, { prompt: SHOP_PROMPT, clientIp: "198.51.100.1" })).resolves.toBeTruthy();
  });

  it("honours the feature kill switch", async () => {
    const ctx = await createTestContext({ env: { AI_PROVIDER: "rules", FEATURE_XRAY: "off" } });
    await expect(runXRay(ctx, { prompt: SHOP_PROMPT, clientIp: IP })).rejects.toMatchObject({ code: "feature_disabled", status: 503 });
  });

  it("reports analysis as unavailable when no provider is configured", async () => {
    const ctx = await createTestContext({ provider: null });
    await expect(runXRay(ctx, { prompt: SHOP_PROMPT, clientIp: IP })).rejects.toMatchObject({ code: "analysis_unavailable" });
  });

  it("serves an identical prompt from cache (case and spacing ignored)", async () => {
    const { provider, calls } = fakeAnthropic();
    const ctx = await createTestContext({ provider });
    await runXRay(ctx, { prompt: SHOP_PROMPT, clientIp: IP });
    const again = await runXRay(ctx, { prompt: `  ${SHOP_PROMPT.toUpperCase()}   `, clientIp: IP });
    expect(calls).toHaveLength(1);
    expect(again.cached).toBe(true);
  });
});

describe("sharing and deletion", () => {
  it("shares only with the owner token, and the shared summary has no prompt-derived detail", async () => {
    const ctx = await createTestContext({ env: { AI_PROVIDER: "rules" } });
    const r = await runXRay(ctx, { prompt: SHOP_PROMPT, clientIp: IP });

    await expect(shareRun(ctx, { runId: r.runId, ownerToken: "x".repeat(43) })).rejects.toMatchObject({ code: "forbidden" });

    const { slug, url } = await shareRun(ctx, { runId: r.runId, ownerToken: r.ownerToken });
    expect(url).toBe(`http://localhost:3000/x/${slug}`);
    expect((await shareRun(ctx, { runId: r.runId, ownerToken: r.ownerToken })).slug).toBe(slug); // idempotent

    const summary = await getSharedSummary(ctx, slug);
    expect(summary?.score).toBe(r.score);
    expect(summary).not.toHaveProperty("appType");
    expect(summary).not.toHaveProperty("assessments");
    expect(summary).not.toHaveProperty("upgradeLines");

    await unshareRun(ctx, { runId: r.runId, ownerToken: r.ownerToken });
    expect(await getSharedSummary(ctx, slug)).toBeNull();
  });

  it("deletes a run for its owner", async () => {
    const ctx = await createTestContext({ env: { AI_PROVIDER: "rules" } });
    const r = await runXRay(ctx, { prompt: SHOP_PROMPT, clientIp: IP });
    await deleteRun(ctx, { runId: r.runId, ownerToken: r.ownerToken });
    expect(await ctx.db.select().from(xrayRuns)).toHaveLength(0);
    await expect(deleteRun(ctx, { runId: r.runId, ownerToken: r.ownerToken })).rejects.toMatchObject({ code: "not_found" });
  });

  it("rejects malformed slugs without touching the database", async () => {
    const ctx = await createTestContext({ env: { AI_PROVIDER: "rules" } });
    expect(await getSharedSummary(ctx, "'; drop table xray_runs; --")).toBeNull();
  });
});
