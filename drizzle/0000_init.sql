CREATE TABLE "ai_cache" (
	"key" text PRIMARY KEY NOT NULL,
	"feature" text NOT NULL,
	"model" text NOT NULL,
	"output" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"hits" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_usage" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"feature" text NOT NULL,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"cost_micro_usd" integer DEFAULT 0 NOT NULL,
	"cache_hit" boolean DEFAULT false NOT NULL,
	"latency_ms" integer DEFAULT 0 NOT NULL,
	"outcome" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"props" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"key" text NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "rate_limits_key_window_start_pk" PRIMARY KEY("key","window_start")
);
--> statement-breakpoint
CREATE TABLE "waitlist_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"tool" text,
	"experience" text,
	"source" text,
	"consented_at" timestamp with time zone NOT NULL,
	CONSTRAINT "waitlist_entries_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "xray_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"prompt_hmac" text NOT NULL,
	"prompt_chars" integer NOT NULL,
	"subject_hmac" text NOT NULL,
	"owner_token_hash" text NOT NULL,
	"mode" text NOT NULL,
	"model" text,
	"cached" boolean DEFAULT false NOT NULL,
	"taxonomy_version" integer NOT NULL,
	"scoring_version" integer NOT NULL,
	"prompt_version" integer NOT NULL,
	"is_software_request" boolean NOT NULL,
	"app_type" text NOT NULL,
	"language" text NOT NULL,
	"traits" jsonb NOT NULL,
	"statuses" jsonb NOT NULL,
	"score" integer NOT NULL,
	"uncapped_score" integer NOT NULL,
	"band" text NOT NULL,
	"silent_count" integer NOT NULL,
	"partial_count" integer NOT NULL,
	"addressed_count" integer NOT NULL,
	"applicable_count" integer NOT NULL,
	"domains" jsonb NOT NULL,
	"top_risks" jsonb NOT NULL,
	"critical_missing" jsonb NOT NULL,
	"cap_applied" boolean NOT NULL,
	"share_slug" text,
	"shared_at" timestamp with time zone,
	CONSTRAINT "xray_runs_share_slug_unique" UNIQUE("share_slug")
);
--> statement-breakpoint
CREATE INDEX "ai_usage_created_at_idx" ON "ai_usage" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "events_name_created_at_idx" ON "events" USING btree ("name","created_at");--> statement-breakpoint
CREATE INDEX "xray_runs_created_at_idx" ON "xray_runs" USING btree ("created_at");