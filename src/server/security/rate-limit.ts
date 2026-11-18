import "server-only";
import { lt, sql } from "drizzle-orm";
import type { Db } from "../db/client";
import { rateLimits } from "../db/schema";

export interface RateLimitResult {
  allowed: boolean;
  count: number;
  limit: number;
  /** Seconds until the current window resets. */
  retryAfterSeconds: number;
}

/**
 * Fixed-window counter in Postgres: one atomic upsert per hit. Works across serverless
 * instances without extra infrastructure. Good enough for Phase 0 volumes; swap for a
 * sliding window or Redis only if measurements show the need (docs/decisions/0006).
 */
export async function hitRateLimit(
  db: Db,
  key: string,
  opts: { windowSeconds: number; limit: number; now: Date },
): Promise<RateLimitResult> {
  const windowMs = opts.windowSeconds * 1000;
  const windowStart = new Date(Math.floor(opts.now.getTime() / windowMs) * windowMs);
  const [row] = await db
    .insert(rateLimits)
    .values({ key, windowStart, count: 1 })
    .onConflictDoUpdate({ target: [rateLimits.key, rateLimits.windowStart], set: { count: sql`${rateLimits.count} + 1` } })
    .returning({ count: rateLimits.count });

  // Opportunistic pruning keeps the table small without a cron job.
  if (Math.random() < 0.02) {
    await db.delete(rateLimits).where(lt(rateLimits.windowStart, new Date(opts.now.getTime() - 2 * 86_400_000)));
  }

  const count = row?.count ?? 1;
  const retryAfterSeconds = Math.max(1, Math.ceil((windowStart.getTime() + windowMs - opts.now.getTime()) / 1000));
  return { allowed: count <= opts.limit, count, limit: opts.limit, retryAfterSeconds };
}
