import { describe, expect, it } from "vitest";
import { aiUsage } from "@/server/db/schema";
import { xrayClassifyFeature } from "@/server/ai/features/xray-classify";
import { AiError, type AiProvider } from "@/server/ai/types";
import { createTestContext, fakeAnthropic } from "../support/test-context";
import { SHOP_PROMPT } from "../support/fixtures";

describe("AiGateway", () => {
  it("calls the provider once, then serves the same key from cache at zero cost", async () => {
    const { provider, calls } = fakeAnthropic();
    const ctx = await createTestContext({ provider });

    const first = await ctx.ai.run(xrayClassifyFeature, { prompt: SHOP_PROMPT }, { cacheKey: "k1" });
    const second = await ctx.ai.run(xrayClassifyFeature, { prompt: SHOP_PROMPT }, { cacheKey: "k1" });

    expect(calls).toHaveLength(1);
    expect(first.cached).toBe(false);
    expect(first.costMicroUsd).toBe(700); // 3000 in + 800 out on Haiku 5.5
    expect(second.cached).toBe(true);
    expect(second.costMicroUsd).toBe(0);
    expect(second.output).toEqual(first.output);

    const ledger = await ctx.db.select().from(aiUsage);
    expect(ledger).toHaveLength(2);
    expect(ledger.map((r) => r.cacheHit).sort()).toEqual([false, true]);
    expect(ledger.reduce((s, r) => s + r.costMicroUsd, 0)).toBe(700);
  });

  it("never serves a simulated cache entry to a real provider", async () => {
    const ctxSim = await createTestContext({ env: { AI_PROVIDER: "simulated" } });
    const sim = await ctxSim.ai.run(xrayClassifyFeature, { prompt: SHOP_PROMPT }, { cacheKey: "same" });
    expect(sim.provider).toBe("simulated");

    // Same database, now with a "real" provider: must miss the cache.
    const { provider, calls } = fakeAnthropic();
    const { AiGateway } = await import("@/server/ai/gateway");
    const real = new AiGateway({ db: ctxSim.db, provider, config: ctxSim.config, retryDelayMs: 0 });
    const res = await real.run(xrayClassifyFeature, { prompt: SHOP_PROMPT }, { cacheKey: "same" });
    expect(res.cached).toBe(false);
    expect(calls).toHaveLength(1);
  });

  it("stops paid calls once the daily budget is spent", async () => {
    const { provider } = fakeAnthropic({ usage: { inputTokens: 10_000_000, outputTokens: 0 } }); // $1.00
    const ctx = await createTestContext({ provider, env: { AI_DAILY_BUDGET_USD: "1" } });
    await ctx.ai.run(xrayClassifyFeature, { prompt: SHOP_PROMPT }, { cacheKey: "a" });
    const err = await ctx.ai.run(xrayClassifyFeature, { prompt: SHOP_PROMPT }, { cacheKey: "b" }).catch((e) => e);
    expect(err).toBeInstanceOf(AiError);
    expect(err.code).toBe("budget_exhausted");
    // Cached answers are still free to serve after the budget is spent.
    const cached = await ctx.ai.run(xrayClassifyFeature, { prompt: SHOP_PROMPT }, { cacheKey: "a" });
    expect(cached.cached).toBe(true);
  });

  it("retries a retryable failure once", async () => {
    let attempts = 0;
    const { provider: inner } = fakeAnthropic();
    const flaky: AiProvider = {
      name: "anthropic",
      async generate(req) {
        attempts++;
        if (attempts === 1) throw new AiError("provider_unavailable", "overloaded", { retryable: true });
        return inner.generate(req);
      },
    };
    const ctx = await createTestContext({ provider: flaky });
    const res = await ctx.ai.run(xrayClassifyFeature, { prompt: SHOP_PROMPT });
    expect(attempts).toBe(2);
    expect(res.cached).toBe(false);
  });

  it("rejects malformed model output and records the failure", async () => {
    const { provider } = fakeAnthropic({ respond: () => ({ nonsense: true }) });
    const ctx = await createTestContext({ provider });
    const err = await ctx.ai.run(xrayClassifyFeature, { prompt: SHOP_PROMPT }, { cacheKey: "bad" }).catch((e) => e);
    expect(err).toBeInstanceOf(AiError);
    expect(err.code).toBe("invalid_output");
    const [row] = await ctx.db.select().from(aiUsage);
    expect(row?.outcome).toBe("invalid_output");
    expect(row?.costMicroUsd).toBeGreaterThan(0); // tokens were still spent
  });

  it("refuses to run when AI is disabled by configuration", async () => {
    const ctx = await createTestContext({ provider: null });
    const err = await ctx.ai.run(xrayClassifyFeature, { prompt: SHOP_PROMPT }).catch((e) => e);
    expect(err.code).toBe("provider_disabled");
  });
});
