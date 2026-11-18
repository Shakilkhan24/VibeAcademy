# 0003: One Postgres schema; PGlite in development and tests, Postgres in production

**Status:** Accepted (Phase 0)

## Context
The plan suggested Postgres (Supabase or Neon) with Drizzle. Contributors and agents should be able to run the app and its integration tests with zero setup, and tests should exercise real SQL.

## Decision
- Drizzle ORM with a `pg-core` schema in `src/server/db/schema.ts`; migrations generated into `/drizzle` and committed.
- `DATABASE_URL` set: `postgres-js` driver (`prepare: false` for transaction poolers). Production: Neon or Supabase.
- `DATABASE_URL` empty: PGlite (Postgres compiled to WASM) embedded in the process, persisted to `.data/pglite`, migrated automatically. Tests use `memory://`.

## Alternatives
- **SQLite for dev:** different SQL dialect and schema; bugs would hide until production.
- **Docker Postgres for dev:** real Postgres, but adds a dependency agents often cannot run.
- **Supabase client SDK everywhere:** couples the app to one vendor's API and to client-side data access.

## Consequences
- Integration tests run real Postgres SQL in about a second per test file.
- PGlite is single-process; it is for development only. Never point production at it.
- Phase 1 auth may bring its own tables; keep them in this schema (ADR 0010).
