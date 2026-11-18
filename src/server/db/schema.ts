import { boolean, index, integer, jsonb, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Database schema. Privacy rule: no table stores raw prompt text or anything derived
 * from it as free text. See docs/privacy.md before adding a column that could.
 *
 * Phase 1 tables (users, projects, decisions, blueprints, card_progress) are designed in
 * docs/architecture.md and arrive with their own migration when Phase 1 starts.
 */

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

/** One Prompt X-Ray analysis. Scores and classifications only: never the prompt. */
export const xrayRuns = pgTable(
  "xray_runs",
  {
    id: text("id").primaryKey(),
    createdAt: createdAt(),
    /** HMAC of the normalised prompt; also the AI cache key. Not reversible without HASH_SECRET. */
    promptHmac: text("prompt_hmac").notNull(),
    promptChars: integer("prompt_chars").notNull(),
    /** HMAC of the visitor's IP, for abuse investigation only. */
    subjectHmac: text("subject_hmac").notNull(),
    ownerTokenHash: text("owner_token_hash").notNull(),
    mode: text("mode", { enum: ["ai", "rules"] }).notNull(),
    model: text("model"),
    cached: boolean("cached").notNull().default(false),
    taxonomyVersion: integer("taxonomy_version").notNull(),
    scoringVersion: integer("scoring_version").notNull(),
    promptVersion: integer("prompt_version").notNull(),
    isSoftwareRequest: boolean("is_software_request").notNull(),
    appType: text("app_type").notNull(),
    language: text("language").notNull(),
    traits: jsonb("traits").notNull(),
    statuses: jsonb("statuses").notNull(),
    score: integer("score").notNull(),
    uncappedScore: integer("uncapped_score").notNull(),
    band: text("band").notNull(),
    silentCount: integer("silent_count").notNull(),
    partialCount: integer("partial_count").notNull(),
    addressedCount: integer("addressed_count").notNull(),
    applicableCount: integer("applicable_count").notNull(),
    domains: jsonb("domains").notNull(),
    topRisks: jsonb("top_risks").notNull(),
    criticalMissing: jsonb("critical_missing").notNull(),
    capApplied: boolean("cap_applied").notNull(),
    /** Set only when the owner opts in to sharing. */
    shareSlug: text("share_slug").unique(),
    sharedAt: timestamp("shared_at", { withTimezone: true }),
  },
  (t) => [index("xray_runs_created_at_idx").on(t.createdAt)],
);

/** Cached AI outputs (classifications, never prompt text), keyed by feature + versions + prompt HMAC. */
export const aiCache = pgTable("ai_cache", {
  key: text("key").primaryKey(),
  feature: text("feature").notNull(),
  model: text("model").notNull(),
  output: jsonb("output").notNull(),
  createdAt: createdAt(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  hits: integer("hits").notNull().default(0),
});

/** Ledger of every AI request, including cache hits and failures. Costs in micro-USD. */
export const aiUsage = pgTable(
  "ai_usage",
  {
    id: text("id").primaryKey(),
    createdAt: createdAt(),
    feature: text("feature").notNull(),
    provider: text("provider").notNull(),
    model: text("model").notNull(),
    inputTokens: integer("input_tokens").notNull().default(0),
    outputTokens: integer("output_tokens").notNull().default(0),
    costMicroUsd: integer("cost_micro_usd").notNull().default(0),
    cacheHit: boolean("cache_hit").notNull().default(false),
    latencyMs: integer("latency_ms").notNull().default(0),
    outcome: text("outcome").notNull(),
  },
  (t) => [index("ai_usage_created_at_idx").on(t.createdAt)],
);

/** Fixed-window rate limit counters. Old windows are pruned opportunistically. */
export const rateLimits = pgTable(
  "rate_limits",
  {
    key: text("key").notNull(),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
    count: integer("count").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.key, t.windowStart] })],
);

export const waitlistEntries = pgTable("waitlist_entries", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: createdAt(),
  tool: text("tool"),
  experience: text("experience"),
  source: text("source"),
  consentedAt: timestamp("consented_at", { withTimezone: true }).notNull(),
});

/** First-party product analytics. Event names and coarse properties only: no PII, no prompts. */
export const events = pgTable(
  "events",
  {
    id: text("id").primaryKey(),
    createdAt: createdAt(),
    name: text("name").notNull(),
    props: jsonb("props").notNull().default({}),
  },
  (t) => [index("events_name_created_at_idx").on(t.name, t.createdAt)],
);
