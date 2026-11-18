import "server-only";
import { and, count, eq, gte, isNotNull, min, sql } from "drizzle-orm";
import type { AppContext } from "../context";
import { aiUsage, waitlistEntries, xrayRuns } from "../db/schema";

/**
 * Numbers for the public /open page. Everything here is computed live from the database;
 * nothing is typed in by hand. Metrics we cannot measure yet are reported as null.
 */
export interface OpenMetrics {
  generatedAt: string;
  analysisMode: "ai" | "rules" | "disabled";
  firstRunAt: string | null;
  xrayTotal: number;
  xrayLast30Days: number;
  rulesRuns: number;
  sharedRuns: number;
  aiRequestsLast30Days: number;
  cacheHitRateLast30Days: number | null;
  aiSpendThisMonthUsd: number;
  avgCostPerPaidCallUsd: number | null;
  dailyBudgetUsd: number;
  waitlistCount: number;
}

export async function getOpenMetrics(ctx: AppContext): Promise<OpenMetrics> {
  const now = ctx.now();
  const since30 = new Date(now.getTime() - 30 * 86_400_000);
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const db = ctx.db;

  const [runs] = await db.select({ total: count(), first: min(xrayRuns.createdAt) }).from(xrayRuns);
  const [recent] = await db.select({ n: count() }).from(xrayRuns).where(gte(xrayRuns.createdAt, since30));
  const [rulesRun] = await db.select({ n: count() }).from(xrayRuns).where(eq(xrayRuns.mode, "rules"));
  const [shared] = await db.select({ n: count() }).from(xrayRuns).where(isNotNull(xrayRuns.shareSlug));
  const [usage] = await db
    .select({
      requests: count(),
      hits: sql<string>`coalesce(sum(case when ${aiUsage.cacheHit} then 1 else 0 end), 0)`,
    })
    .from(aiUsage)
    .where(gte(aiUsage.createdAt, since30));
  const [spend] = await db
    .select({
      micro: sql<string>`coalesce(sum(${aiUsage.costMicroUsd}), 0)`,
      paidCalls: sql<string>`coalesce(sum(case when ${aiUsage.costMicroUsd} > 0 then 1 else 0 end), 0)`,
    })
    .from(aiUsage)
    .where(and(gte(aiUsage.createdAt, monthStart)));
  const [waitlist] = await db.select({ n: count() }).from(waitlistEntries);

  const requests = Number(usage?.requests ?? 0);
  const hits = Number(usage?.hits ?? 0);
  const micro = Number(spend?.micro ?? 0);
  const paidCalls = Number(spend?.paidCalls ?? 0);
  const provider = ctx.ai.providerName;

  return {
    generatedAt: now.toISOString(),
    analysisMode: provider === "anthropic" ? "ai" : provider,
    firstRunAt: runs?.first ? new Date(runs.first).toISOString() : null,
    xrayTotal: Number(runs?.total ?? 0),
    xrayLast30Days: Number(recent?.n ?? 0),
    rulesRuns: Number(rulesRun?.n ?? 0),
    sharedRuns: Number(shared?.n ?? 0),
    aiRequestsLast30Days: requests,
    cacheHitRateLast30Days: requests > 0 ? hits / requests : null,
    aiSpendThisMonthUsd: micro / 1_000_000,
    avgCostPerPaidCallUsd: paidCalls > 0 ? micro / paidCalls / 1_000_000 : null,
    dailyBudgetUsd: ctx.config.ai.dailyBudgetMicroUsd / 1_000_000,
    waitlistCount: Number(waitlist?.n ?? 0),
  };
}
