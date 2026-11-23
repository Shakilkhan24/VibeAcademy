import "server-only";
import { randomUUID } from "node:crypto";
import type { Db } from "./db/client";
import { events } from "./db/schema";

/**
 * First-party analytics (docs/decisions/0007-analytics.md). Event names are a closed list
 * and properties must be coarse and non-identifying: never an email, IP, prompt or free text.
 */
export type EventName =
  | "xray_completed"
  | "xray_failed"
  | "xray_shared"
  | "xray_unshared"
  | "xray_deleted"
  | "waitlist_joined"
  | "waitlist_deleted"
  | "lesson_completed"
  | "lesson_feedback";

export type EventProps = Record<string, string | number | boolean | null>;

export async function recordEvent(db: Db, name: EventName, props: EventProps = {}): Promise<void> {
  try {
    await db.insert(events).values({ id: randomUUID(), name, props });
  } catch {
    // Analytics must never break a user-facing request.
    console.warn(JSON.stringify({ event: "analytics_write_failure", timestamp: new Date().toISOString(), name }));
  }
}
