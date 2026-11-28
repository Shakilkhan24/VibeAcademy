import { cpSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { sql } from "drizzle-orm";
import { MIGRATIONS_FOLDER } from "@/server/db/client";

/** A copy of the migrations folder that stops after the first `count` entries (an older release). */
function migrationsUpTo(count: number) {
  const dir = mkdtempSync(path.join(tmpdir(), "va-migrations-"));
  cpSync(MIGRATIONS_FOLDER, dir, { recursive: true });
  const journalPath = path.join(dir, "meta", "_journal.json");
  const journal = JSON.parse(readFileSync(journalPath, "utf8")) as { entries: unknown[] };
  journal.entries = journal.entries.slice(0, count);
  writeFileSync(journalPath, JSON.stringify(journal));
  return dir;
}

describe("M2 migration on an existing M1 database", () => {
  it("adds accounts and projects, keeps M1 rows, and is safe to run twice", async () => {
    const client = new PGlite("memory://");
    const db = drizzle({ client });
    await migrate(db, { migrationsFolder: migrationsUpTo(2) }); // M1: init + lesson feedback

    await db.execute(sql`insert into waitlist_entries (id, email, consented_at) values ('w1', 'early@example.com', now())`);
    await db.execute(sql`insert into events (id, name, props) values ('e1', 'lesson_feedback', '{"slug":"choose-one-job","version":1}')`);
    await db.execute(sql`insert into lesson_feedback (event_id, helpful, comment) values ('e1', true, 'Clear')`);
    await db.execute(sql`insert into xray_runs (id, prompt_hmac, prompt_chars, subject_hmac, owner_token_hash, mode, taxonomy_version,
      scoring_version, prompt_version, is_software_request, app_type, language, traits, statuses, score, uncapped_score, band,
      silent_count, partial_count, addressed_count, applicable_count, domains, top_risks, critical_missing, cap_applied)
      values ('00000000-0000-4000-8000-000000000001', 'h', 40, 's', 't', 'rules', 2, 1, 1, true, 'online-shop', 'en', '{}', '{}',
      30, 30, 'mostly-silent', 1, 0, 0, 1, '[]', '[]', '[]', false)`);

    await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
    await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER }); // repeat: no-op

    const count = async (table: string) => Number((await db.execute(sql.raw(`select count(*)::int as n from ${table}`))).rows[0]!.n);
    expect(await count("waitlist_entries")).toBe(1);
    expect(await count("lesson_feedback")).toBe(1);
    expect(await count("xray_runs")).toBe(1);
    for (const table of ["users", "sessions", "accounts", "verifications", "lesson_completions", "projects", "project_decisions"]) {
      expect(await count(table)).toBe(0);
    }
    const run = await db.execute(sql`select user_id from xray_runs`);
    expect(run.rows[0]).toEqual({ user_id: null });
    await client.close();
  });
});
