import "server-only";
import { z } from "zod";

/**
 * Validated configuration. Read once per process (or per test via `loadConfig(overrides)`).
 * Never import process.env elsewhere in server code: add the variable here instead.
 */
const onOff = z.enum(["on", "off"]).default("on").transform((v) => v === "on");
const emptyToUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_SITE_URL: z.preprocess(emptyToUndefined, z.url().default("http://localhost:3000")),
  DATABASE_URL: z.preprocess(emptyToUndefined, z.string().optional()),
  PGLITE_DATA_DIR: z.preprocess(emptyToUndefined, z.string().default(".data/pglite")),
  HASH_SECRET: z.preprocess(emptyToUndefined, z.string().min(16).optional()),
  AI_PROVIDER: z.preprocess(emptyToUndefined, z.enum(["rules", "anthropic"]).default("rules")),
  ANTHROPIC_API_KEY: z.preprocess(emptyToUndefined, z.string().optional()),
  AI_MODEL_XRAY: z.preprocess(emptyToUndefined, z.string().default("claude-haiku-5-5")),
  AI_DAILY_BUDGET_USD: z.preprocess(emptyToUndefined, z.coerce.number().nonnegative().default(2)),
  FEATURE_XRAY: z.preprocess(emptyToUndefined, onOff),
  FEATURE_WAITLIST: z.preprocess(emptyToUndefined, onOff),
  XRAY_DAILY_LIMIT: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().default(8)),
  XRAY_MINUTE_LIMIT: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().default(3)),
});

/**
 * "rules": the rule-based X-Ray check, the default engine. No API key, no cost.
 * "anthropic": AI-assisted classification. DEFERRED: built and tested against mocks, but kept
 * opt-in until the AI milestone (docs/roadmap.md). Never selected just because a key exists.
 */
export type AiProviderName = "rules" | "anthropic" | "disabled";

export interface AppConfig {
  env: "development" | "test" | "production";
  siteUrl: string;
  databaseUrl?: string;
  pgliteDataDir: string;
  hashSecret: string;
  ai: {
    provider: AiProviderName;
    /** Why the provider was chosen; shown on /open and in health checks. */
    providerReason: string;
    anthropicApiKey?: string;
    models: { xray: string };
    dailyBudgetMicroUsd: number;
  };
  features: { xray: boolean; waitlist: boolean };
  limits: { xrayPerDay: number; xrayPerMinute: number; waitlistPerHour: number };
}

/** Development-only fallback. Production refuses to start without HASH_SECRET. */
const DEV_HASH_SECRET = "dev-only-hash-secret-do-not-use-in-production";

export function loadConfig(source: Record<string, string | undefined> = process.env): AppConfig {
  const parsed = EnvSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid environment configuration: ${issues}`);
  }
  const e = parsed.data;
  const isProd = e.NODE_ENV === "production";

  if (isProd && !e.HASH_SECRET) {
    throw new Error("HASH_SECRET is required in production (openssl rand -base64 32).");
  }

  let provider: AiProviderName;
  let providerReason: string;
  if (e.AI_PROVIDER === "anthropic" && !e.ANTHROPIC_API_KEY) {
    provider = "disabled";
    providerReason = "AI_PROVIDER=anthropic but ANTHROPIC_API_KEY is not set.";
  } else if (e.AI_PROVIDER === "anthropic") {
    provider = "anthropic";
    providerReason = "AI-assisted analysis selected with AI_PROVIDER=anthropic.";
  } else {
    provider = "rules";
    providerReason = "Rule-based check (the default). AI-assisted analysis is a later milestone.";
  }

  return {
    env: e.NODE_ENV,
    siteUrl: e.NEXT_PUBLIC_SITE_URL.replace(/\/$/, ""),
    databaseUrl: e.DATABASE_URL,
    pgliteDataDir: e.PGLITE_DATA_DIR,
    hashSecret: e.HASH_SECRET ?? DEV_HASH_SECRET,
    ai: {
      provider,
      providerReason,
      anthropicApiKey: e.ANTHROPIC_API_KEY,
      models: { xray: e.AI_MODEL_XRAY },
      dailyBudgetMicroUsd: Math.round(e.AI_DAILY_BUDGET_USD * 1_000_000),
    },
    features: { xray: e.FEATURE_XRAY, waitlist: e.FEATURE_WAITLIST },
    limits: { xrayPerDay: e.XRAY_DAILY_LIMIT, xrayPerMinute: e.XRAY_MINUTE_LIMIT, waitlistPerHour: 5 },
  };
}
