import { sql } from "drizzle-orm";
import { getAppContext } from "@/server/context";
import { aiCache, aiUsage, events, lessonFeedback, rateLimits, waitlistEntries, xrayRuns } from "@/server/db/schema";
import { json, reportApiFailure } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Readiness for uptime checks. Resolves the app's tables without fetching visitor data. */
export async function GET() {
  try {
    const ctx = await getAppContext();
    await ctx.db.execute(sql`
      select 1 from ${xrayRuns}, ${waitlistEntries}, ${events}, ${rateLimits}, ${aiCache}, ${aiUsage}, ${lessonFeedback}
      limit 0
    `);
    return json({ ok: true, database: "up", analysis: ctx.ai.providerName, features: ctx.config.features });
  } catch {
    reportApiFailure("GET /api/health", 503, "not_ready");
    return json({ ok: false, database: "down" }, 503);
  }
}
