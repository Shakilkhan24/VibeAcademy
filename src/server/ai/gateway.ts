import "server-only";
import { randomUUID } from "node:crypto";
import { and, eq, gt, gte, sql } from "drizzle-orm";
import type { Db } from "../db/client";
import { aiCache, aiUsage } from "../db/schema";
import type { AppConfig } from "../env";
import { costMicroUsd } from "./pricing";
import { AiError, type AiFeature, type AiProvider, type Usage } from "./types";

export interface GatewayDeps {
  db: Db;
  /** Null when AI is disabled by configuration (see env.ts). */
  provider: AiProvider | null;
  config: AppConfig;
  now?: () => Date;
  timeoutMs?: number;
  retryDelayMs?: number;
}

export interface GatewayResult<T> {
  output: T;
  cached: boolean;
  provider: AiProvider["name"];
  model: string;
  costMicroUsd: number;
}

const RULES_MODEL = "keyword-rules";

export function startOfUtcDay(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/**
 * The single pathway for model calls. In order: provider check, cache, daily budget,
 * provider call with timeout and one retry, output validation, cache write, usage ledger.
 *
 * Feature flags and per-visitor rate limits are product decisions and live in the calling
 * service (e.g. services/xray.ts), because they apply even when the gateway serves from cache.
 */
export class AiGateway {
  private readonly now: () => Date;
  private readonly timeoutMs: number;
  private readonly retryDelayMs: number;

  constructor(private readonly deps: GatewayDeps) {
    this.now = deps.now ?? (() => new Date());
    this.timeoutMs = deps.timeoutMs ?? 25_000;
    this.retryDelayMs = deps.retryDelayMs ?? 600;
  }

  get providerName(): AiProvider["name"] | "disabled" {
    return this.deps.provider?.name ?? "disabled";
  }

  async run<TInput, TOutput>(
    feature: AiFeature<TInput, TOutput>,
    input: TInput,
    opts: { cacheKey?: string } = {},
  ): Promise<GatewayResult<TOutput>> {
    const provider = this.deps.provider;
    if (!provider) throw new AiError("provider_disabled", this.deps.config.ai.providerReason);

    const model = provider.name === "rules" ? RULES_MODEL : feature.model(this.deps.config.ai);
    // Provider and model are part of the key: a rule-based result can never be served as AI.
    const cacheKey = opts.cacheKey
      ? [feature.key, `p${feature.promptVersion}`, `c${feature.contentVersion}`, provider.name, model, opts.cacheKey].join("|")
      : undefined;

    if (cacheKey) {
      const hit = await this.readCache(feature, cacheKey);
      if (hit !== undefined) {
        await this.recordUsage({ feature: feature.key, provider: provider.name, model, usage: { inputTokens: 0, outputTokens: 0 }, cost: 0, cacheHit: true, latencyMs: 0, outcome: "ok" });
        return { output: hit, cached: true, provider: provider.name, model, costMicroUsd: 0 };
      }
    }

    if (provider.name !== "rules") await this.assertBudget();

    const started = Date.now();
    let usage: Usage = { inputTokens: 0, outputTokens: 0 };
    try {
      const response = await this.callWithRetry(provider, feature, input, model);
      usage = response.usage;
      const output = feature.parse(response.json);
      const cost = provider.name === "rules" ? 0 : costMicroUsd(model, usage);
      if (cacheKey) await this.writeCache(feature, cacheKey, model, response.json);
      await this.recordUsage({ feature: feature.key, provider: provider.name, model, usage, cost, cacheHit: false, latencyMs: Date.now() - started, outcome: "ok" });
      return { output, cached: false, provider: provider.name, model: response.model, costMicroUsd: cost };
    } catch (error) {
      const aiError = error instanceof AiError ? error : new AiError("invalid_output", error instanceof Error ? error.message : "Invalid AI output.");
      const spent = aiError.usage ?? usage;
      const cost = provider.name === "rules" ? 0 : costMicroUsd(model, spent);
      await this.recordUsage({ feature: feature.key, provider: provider.name, model, usage: spent, cost, cacheHit: false, latencyMs: Date.now() - started, outcome: aiError.code });
      throw aiError;
    }
  }

  /** Total AI spend today (UTC), in micro-USD. */
  async spentTodayMicroUsd(): Promise<number> {
    const [row] = await this.deps.db
      .select({ total: sql<string | null>`coalesce(sum(${aiUsage.costMicroUsd}), 0)` })
      .from(aiUsage)
      .where(gte(aiUsage.createdAt, startOfUtcDay(this.now())));
    return Number(row?.total ?? 0);
  }

  private async assertBudget() {
    const spent = await this.spentTodayMicroUsd();
    if (spent >= this.deps.config.ai.dailyBudgetMicroUsd) {
      throw new AiError("budget_exhausted", "Today's AI budget is used up. Analysis resumes at 00:00 UTC.");
    }
  }

  private async callWithRetry<TInput, TOutput>(provider: AiProvider, feature: AiFeature<TInput, TOutput>, input: TInput, model: string) {
    for (let attempt = 1; ; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        return await provider.generate({
          feature: feature.key,
          model,
          system: feature.system(),
          user: feature.user(input),
          jsonSchema: feature.jsonSchema(),
          maxOutputTokens: feature.maxOutputTokens,
          input,
          signal: controller.signal,
        });
      } catch (error) {
        const retryable = error instanceof AiError && error.retryable;
        if (!retryable || attempt >= 2) throw error;
        await new Promise((r) => setTimeout(r, this.retryDelayMs));
      } finally {
        clearTimeout(timer);
      }
    }
  }

  private async readCache<TInput, TOutput>(feature: AiFeature<TInput, TOutput>, key: string): Promise<TOutput | undefined> {
    const [row] = await this.deps.db
      .select({ output: aiCache.output })
      .from(aiCache)
      .where(and(eq(aiCache.key, key), gt(aiCache.expiresAt, this.now())))
      .limit(1);
    if (!row) return undefined;
    try {
      const parsed = feature.parse(row.output);
      await this.deps.db.update(aiCache).set({ hits: sql`${aiCache.hits} + 1` }).where(eq(aiCache.key, key));
      return parsed;
    } catch {
      return undefined; // stale or corrupt entry: fall through to a fresh call
    }
  }

  private async writeCache<TInput, TOutput>(feature: AiFeature<TInput, TOutput>, key: string, model: string, output: unknown) {
    const expiresAt = new Date(this.now().getTime() + feature.cacheTtlSeconds * 1000);
    await this.deps.db
      .insert(aiCache)
      .values({ key, feature: feature.key, model, output, expiresAt })
      .onConflictDoUpdate({ target: aiCache.key, set: { output, expiresAt, model } });
  }

  private async recordUsage(entry: { feature: string; provider: string; model: string; usage: Usage; cost: number; cacheHit: boolean; latencyMs: number; outcome: string }) {
    await this.deps.db.insert(aiUsage).values({
      id: randomUUID(),
      feature: entry.feature,
      provider: entry.provider,
      model: entry.model,
      inputTokens: entry.usage.inputTokens,
      outputTokens: entry.usage.outputTokens,
      costMicroUsd: entry.cost,
      cacheHit: entry.cacheHit,
      latencyMs: entry.latencyMs,
      outcome: entry.outcome,
    });
  }
}
