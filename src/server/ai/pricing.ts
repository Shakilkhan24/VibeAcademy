import "server-only";
import type { Usage } from "./types";

/**
 * USD per million tokens, from https://platform.claude.com/docs/en/about-claude/pricing
 * (checked 2026-11-18). Haiku 5.5 has a higher tier for prompts over 100K tokens; X-Ray
 * inputs are capped far below that, so only the base tier is listed.
 *
 * Re-check this table when changing models: /open and the daily budget depend on it.
 */
export const MODEL_PRICING: Record<string, { inputPerMTok: number; outputPerMTok: number }> = {
  "claude-haiku-5-5": { inputPerMTok: 0.1, outputPerMTok: 0.5 },
  "claude-sonnet-5-5": { inputPerMTok: 2, outputPerMTok: 10 },
  "claude-opus-5-5": { inputPerMTok: 4, outputPerMTok: 20 },
  "claude-fable-5-2": { inputPerMTok: 8, outputPerMTok: 40 },
};

/** Unknown models are costed at the most expensive known rate so budgets fail safe. */
const FALLBACK = { inputPerMTok: 8, outputPerMTok: 40 };

export function priceFor(model: string) {
  return MODEL_PRICING[model] ?? FALLBACK;
}

/** Cost in micro-USD (1 USD = 1,000,000). tokens × USD-per-million = micro-USD. */
export function costMicroUsd(model: string, usage: Usage): number {
  const p = priceFor(model);
  return Math.ceil(usage.inputTokens * p.inputPerMTok + usage.outputTokens * p.outputPerMTok);
}
