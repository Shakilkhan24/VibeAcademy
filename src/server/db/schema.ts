import { boolean, index, integer, jsonb, pgTable, primaryKey, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";

/**
 * Database schema. Privacy rule: no table stores raw prompt text or anything derived
 * from it as free text. See docs/privacy.md before adding a column that could.
 *
 * Phase 1 (M2) adds accounts (Better Auth, ADR 0010), lesson completions, projects and their
 * Blueprint decisions. Every learner-owned row carries user_id, and every service query that
 * reads or changes one filters by it (tests/server/*-access.test.ts).
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
    /** Set when a signed-in learner ran the X-Ray. Anonymous runs stay owned by their token. */
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
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

/** Optional reader comments stay private. Only votes contribute to public aggregates. */
export const lessonFeedback = pgTable("lesson_feedback", {
  eventId: text("event_id").primaryKey().references(() => events.id, { onDelete: "cascade" }),
  helpful: boolean("helpful").notNull(),
  comment: varchar("comment", { length: 500 }),
});

// ---------------------------------------------------------------------------------------
// Accounts. Better Auth owns these four tables (field names are its model fields; columns
// are snake_case). Google is the only sign-in method, so `accounts.password` stays empty.

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: createdAt(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  },
  (t) => [index("sessions_user_id_idx").on(t.userId)],
);

export const accounts = pgTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    /** OAuth tokens are encrypted by Better Auth before storage (encryptOAuthTokens). */
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("accounts_user_id_idx").on(t.userId), uniqueIndex("accounts_provider_account_idx").on(t.providerId, t.accountId)],
);

export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: createdAt(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------------------
// Learner data (M2). Each row belongs to exactly one learner.

/** Lessons a learner marked complete. Imports and re-marks upsert; they never add events. */
export const lessonCompletions = pgTable(
  "lesson_completions",
  {
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    lessonSlug: text("lesson_slug").notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.lessonSlug] })],
);

/** One app a learner is building. Traits and evidence are taxonomy IDs and statuses, never prompt text. */
export const projects = pgTable(
  "projects",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    appType: text("app_type").notNull(),
    traits: jsonb("traits").notNull(),
    chapter: text("chapter").notNull(),
    taxonomyVersion: integer("taxonomy_version").notNull(),
    /** The X-Ray this project started from, if any, and the statuses it found per decision. */
    sourceRunId: text("source_run_id").references(() => xrayRuns.id, { onDelete: "set null" }),
    evidence: jsonb("evidence").notNull().default({}),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("projects_user_id_idx").on(t.userId, t.createdAt)],
);

/** The Blueprint: one chosen option per decision. Matches BlueprintDecision in build-pack.ts. */
export const projectDecisions = pgTable(
  "project_decisions",
  {
    projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    decisionId: text("decision_id").notNull(),
    cardSlug: text("card_slug").notNull(),
    cardVersion: integer("card_version").notNull(),
    optionKey: text("option_key").notNull(),
    promptLine: text("prompt_line").notNull(),
    decidedAt: timestamp("decided_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.projectId, t.decisionId] })],
);
