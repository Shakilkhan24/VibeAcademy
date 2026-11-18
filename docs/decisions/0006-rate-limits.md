# 0006: Rate limits as Postgres fixed windows

**Status:** Accepted (Phase 0)

## Decision
A `rate_limits` table with one atomic upsert per hit (key, window start, count). Keys use HMAC'd IPs. Old windows are pruned opportunistically. Defaults: 3 X-Rays per minute and 8 per day per visitor; 5 waitlist sign-ups per hour.

## Alternatives
Redis or Upstash (another service), in-memory (breaks across serverless instances), edge middleware (no database access).

## Consequences
One extra write per request; fine at Phase 0 volume. Revisit if the database shows contention or when a CDN-level bot shield is added.
