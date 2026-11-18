/**
 * Applies SQL migrations from ./drizzle to the database in DATABASE_URL.
 * Run on every deploy, before the new version receives traffic: pnpm db:migrate
 *
 * Development needs nothing: the embedded PGlite database migrates itself on first use.
 */
import { createPgliteDb, createPostgresDb, MIGRATIONS_FOLDER } from "../src/server/db/client";

async function main() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    const dir = process.env.PGLITE_DATA_DIR?.trim() || ".data/pglite";
    await createPgliteDb(dir); // migrates as part of creation
    console.info(`Migrated embedded PGlite database at ${dir}.`);
    return;
  }
  const { migrate } = await import("drizzle-orm/postgres-js/migrator");
  const db = await createPostgresDb(url);
  await migrate(db as never, { migrationsFolder: MIGRATIONS_FOLDER });
  console.info("Migrated Postgres database.");
  process.exit(0);
}

main().catch((error) => {
  console.error("Migration failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
