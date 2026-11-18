import { createPgliteDb } from "@/server/db/client";
import { loadConfig } from "@/server/env";
import { createAppContext, type AppContext } from "@/server/context";
import type { AiProvider, StructuredRequest, StructuredResponse } from "@/server/ai/types";
import { classifyWithRules } from "@/server/ai/providers/rules";

/** A fresh in-memory Postgres (PGlite) with migrations applied. */
export async function createTestDb() {
  return createPgliteDb("memory://");
}

export async function createTestContext(opts: {
  env?: Record<string, string>;
  provider?: AiProvider | null;
  now?: () => Date;
} = {}): Promise<AppContext> {
  const db = await createTestDb();
  const config = loadConfig({ NODE_ENV: "test", HASH_SECRET: "test-secret-test-secret", ...(opts.env ?? {}) });
  return createAppContext({ db, config, provider: opts.provider, now: opts.now, retryDelayMs: 0 });
}

/**
 * A fake "real" provider: behaves like Anthropic (name, usage, cost) but answers with the
 * rule-based classifier so tests are deterministic. Records every call.
 */
export function fakeAnthropic(opts: { usage?: { inputTokens: number; outputTokens: number }; respond?: (req: StructuredRequest) => unknown } = {}) {
  const calls: StructuredRequest[] = [];
  const provider: AiProvider = {
    name: "anthropic",
    async generate(req: StructuredRequest): Promise<StructuredResponse> {
      calls.push(req);
      const prompt = (req.input as { prompt: string }).prompt;
      const json = opts.respond ? opts.respond(req) : classifyWithRules(prompt);
      return { json, usage: opts.usage ?? { inputTokens: 3000, outputTokens: 800 }, model: req.model };
    },
  };
  return { provider, calls };
}
