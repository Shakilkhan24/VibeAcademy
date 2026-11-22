import { describe, expect, it } from "vitest";
import { events, waitlistEntries } from "@/server/db/schema";
import { joinWaitlist } from "@/server/services/waitlist";
import { getOpenMetrics } from "@/server/services/open-metrics";
import { runXRay } from "@/server/services/xray";
import { loadConfig } from "@/server/env";
import { createTestContext, fakeAnthropic } from "../support/test-context";
import { SHOP_PROMPT } from "../support/fixtures";

describe("joinWaitlist", () => {
  it("stores a normalised email once and answers identically for duplicates", async () => {
    const ctx = await createTestContext({ env: { AI_PROVIDER: "rules" } });
    const body = { email: "  Ada@Example.COM ", tool: "lovable", experience: "no-code", source: "private-campaign-tag", consent: true };
    expect(await joinWaitlist(ctx, { body, clientIp: "1.1.1.1" })).toEqual({ ok: true });
    expect(await joinWaitlist(ctx, { body, clientIp: "1.1.1.1" })).toEqual({ ok: true });
    const rows = await ctx.db.select().from(waitlistEntries);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.email).toBe("ada@example.com");
    const evs = await ctx.db.select().from(events);
    expect(evs).toHaveLength(1);
    expect(evs[0]?.props).toMatchObject({ fromXray: false });
    expect(JSON.stringify(evs)).not.toContain("private-campaign-tag");
    expect(JSON.stringify(evs)).not.toContain("ada@");
  });

  it("requires consent and a valid email", async () => {
    const ctx = await createTestContext({ env: { AI_PROVIDER: "rules" } });
    await expect(joinWaitlist(ctx, { body: { email: "ada@example.com" }, clientIp: "1" })).rejects.toMatchObject({ code: "invalid_input" });
    await expect(joinWaitlist(ctx, { body: { email: "not-an-email", consent: true }, clientIp: "1" })).rejects.toMatchObject({ code: "invalid_input" });
    await expect(joinWaitlist(ctx, { body: { email: "a@b.co", consent: true, tool: "notepad" }, clientIp: "1" })).rejects.toMatchObject({ code: "invalid_input" });
  });
});

describe("loadConfig", () => {
  it("uses the rule-based check by default, in development and production", () => {
    expect(loadConfig({ NODE_ENV: "development" }).ai.provider).toBe("rules");
    expect(loadConfig({ NODE_ENV: "production", HASH_SECRET: "a-long-production-secret" }).ai.provider).toBe("rules");
  });

  it("never switches to paid AI just because a key is present", () => {
    expect(loadConfig({ NODE_ENV: "development", ANTHROPIC_API_KEY: "sk" }).ai.provider).toBe("rules");
  });

  it("uses Anthropic only when selected explicitly and a key is set", () => {
    expect(loadConfig({ AI_PROVIDER: "anthropic", ANTHROPIC_API_KEY: "sk" }).ai.provider).toBe("anthropic");
    expect(loadConfig({ AI_PROVIDER: "anthropic" }).ai.provider).toBe("disabled");
  });

  it("requires HASH_SECRET in production", () => {
    expect(() => loadConfig({ NODE_ENV: "production" })).toThrow(/HASH_SECRET/);
  });

  it("converts the daily budget to micro-USD", () => {
    expect(loadConfig({ AI_DAILY_BUDGET_USD: "2.5" }).ai.dailyBudgetMicroUsd).toBe(2_500_000);
  });
});

describe("getOpenMetrics", () => {
  it("computes signup rates from recent events and counts an email only once", async () => {
    const now = new Date(Date.now() + 60_000);
    const ctx = await createTestContext({ now: () => now });
    const body = { email: "learner@example.com", source: "xray", consent: true };
    await joinWaitlist(ctx, { body, clientIp: "1" });
    await joinWaitlist(ctx, { body, clientIp: "1" });
    await joinWaitlist(ctx, { body: { ...body, email: "other@example.com", source: "home" }, clientIp: "2" });
    expect((await getOpenMetrics(ctx)).xraySignupsPerHundredRuns).toBeNull();
    await ctx.db.insert(events).values([
      { id: "check-1", name: "xray_completed" }, { id: "check-2", name: "xray_completed" },
      { id: "old-signup", name: "waitlist_joined", createdAt: new Date(now.getTime() - 31 * 86_400_000) },
      { id: "failed-check", name: "xray_failed" },
    ]);
    const metrics = await getOpenMetrics(ctx);
    expect(metrics.waitlistSignupsPerDay).toBeCloseTo(2 / 30);
    expect(metrics.xraySignupsPerHundredRuns).toBe(50);
    await ctx.db.insert(events).values({ id: "unattributed", name: "waitlist_joined" });
    const legacy = await getOpenMetrics(ctx);
    expect(legacy.waitlistSignupsPerDay).toBeCloseTo(3 / 30);
    expect(legacy.xraySignupsPerHundredRuns).toBeNull();
  });

  it("reports live counts and spend from the ledger", async () => {
    const { provider } = fakeAnthropic();
    const ctx = await createTestContext({ provider });
    await runXRay(ctx, { prompt: SHOP_PROMPT, clientIp: "1" });
    await runXRay(ctx, { prompt: SHOP_PROMPT, clientIp: "1" }); // cache hit
    const m = await getOpenMetrics(ctx);
    expect(m.analysisMode).toBe("ai");
    expect(m.xrayTotal).toBe(2);
    expect(m.cacheHitRateLast30Days).toBe(0.5);
    expect(m.aiSpendThisMonthUsd).toBeCloseTo(0.0007, 6);
    expect(m.avgCostPerPaidCallUsd).toBeCloseTo(0.0007, 6);
    expect(m.waitlistCount).toBe(0);
  });
});
