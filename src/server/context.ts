import "server-only";
import { AiGateway } from "./ai/gateway";
import { createAnthropicProvider } from "./ai/providers/anthropic";
import { createRulesProvider } from "./ai/providers/rules";
import type { AiProvider } from "./ai/types";
import { getDb, type Db } from "./db/client";
import { loadConfig, type AppConfig } from "./env";

/**
 * Everything a service needs, passed explicitly. Routes call getAppContext(); tests build
 * their own context with an in-memory database and a fake provider.
 */
export interface AppContext {
  db: Db;
  config: AppConfig;
  ai: AiGateway;
  now: () => Date;
}

export function providerFor(config: AppConfig): AiProvider | null {
  switch (config.ai.provider) {
    case "anthropic":
      return createAnthropicProvider({ apiKey: config.ai.anthropicApiKey! });
    case "rules":
      return createRulesProvider();
    default:
      return null;
  }
}

export function createAppContext(parts: { db: Db; config: AppConfig; provider?: AiProvider | null; now?: () => Date; retryDelayMs?: number }): AppContext {
  const now = parts.now ?? (() => new Date());
  const provider = parts.provider === undefined ? providerFor(parts.config) : parts.provider;
  return {
    db: parts.db,
    config: parts.config,
    now,
    ai: new AiGateway({ db: parts.db, provider, config: parts.config, now, retryDelayMs: parts.retryDelayMs }),
  };
}

const globalForCtx = globalThis as unknown as { __seniorseatCtx?: Promise<AppContext> };

export function getAppContext(): Promise<AppContext> {
  if (!globalForCtx.__seniorseatCtx) {
    globalForCtx.__seniorseatCtx = (async () => {
      const config = loadConfig();
      const db = await getDb({ databaseUrl: config.databaseUrl, pgliteDataDir: config.pgliteDataDir });
      return createAppContext({ db, config });
    })();
    globalForCtx.__seniorseatCtx.catch(() => {
      globalForCtx.__seniorseatCtx = undefined;
    });
  }
  return globalForCtx.__seniorseatCtx;
}
