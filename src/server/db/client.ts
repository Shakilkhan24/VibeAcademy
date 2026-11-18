import "server-only";
import path from "node:path";
import { mkdirSync } from "node:fs";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";

/**
 * One schema, two drivers (see docs/decisions/0003-database.md):
 *  - DATABASE_URL set   -> postgres-js against real Postgres (Neon, Supabase, RDS). Migrate with `pnpm db:migrate`.
 *  - DATABASE_URL empty -> PGlite: real Postgres compiled to WASM, embedded in the process.
 *                          Migrations run automatically. Zero setup for development and tests.
 */
export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

export const MIGRATIONS_FOLDER = path.join(process.cwd(), "drizzle");

export async function createPgliteDb(dataDir: string): Promise<Db> {
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  if (!dataDir.startsWith("memory://")) mkdirSync(dataDir, { recursive: true });
  const client = new PGlite(dataDir);
  const db = drizzle({ client, schema });
  await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
  return db as unknown as Db;
}

export async function createPostgresDb(url: string): Promise<Db> {
  const { default: postgres } = await import("postgres");
  const { drizzle } = await import("drizzle-orm/postgres-js");
  // prepare: false keeps us compatible with transaction-mode poolers (Supabase, Neon pooler).
  const client = postgres(url, { max: 5, prepare: false });
  return drizzle({ client, schema }) as unknown as Db;
}

const globalForDb = globalThis as unknown as { __seniorseatDb?: Promise<Db> };

/** Process-wide database. Cached on globalThis so dev hot reloads reuse one PGlite instance. */
export function getDb(opts: { databaseUrl?: string; pgliteDataDir: string }): Promise<Db> {
  if (!globalForDb.__seniorseatDb) {
    globalForDb.__seniorseatDb = opts.databaseUrl ? createPostgresDb(opts.databaseUrl) : createPgliteDb(opts.pgliteDataDir);
    globalForDb.__seniorseatDb.catch(() => {
      globalForDb.__seniorseatDb = undefined; // allow a retry after a failed boot
    });
  }
  return globalForDb.__seniorseatDb;
}

export { schema };
