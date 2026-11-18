import { sql } from "drizzle-orm";
import { getAppContext } from "@/server/context";
import { json } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Liveness and readiness for uptime checks. Reveals no secrets. */
export async function GET() {
  try {
    const ctx = await getAppContext();
    await ctx.db.execute(sql`select 1`);
    return json({ ok: true, database: "up", analysis: ctx.ai.providerName, features: ctx.config.features });
  } catch {
    return json({ ok: false, database: "down" }, 503);
  }
}
