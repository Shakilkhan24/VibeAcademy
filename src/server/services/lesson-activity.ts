import "server-only";
import { z } from "zod";
import { loadTutorials } from "@/content/tutorials";
import { TutorialMetadataSchema } from "@/domain/content/tutorial-schema";
import type { AppContext } from "../context";
import { events, lessonFeedback } from "../db/schema";
import type { EventName } from "../events";
import { hmac, sha256 } from "../security/crypto";
import { hitRateLimit } from "../security/rate-limit";
import { ServiceError } from "./errors";

const lesson = TutorialMetadataSchema.pick({ slug: true, version: true }).extend({ submissionId: z.uuid() });
const activity = z.discriminatedUnion("kind", [
  lesson.extend({ kind: z.literal("completed") }),
  lesson.extend({ kind: z.literal("feedback"), helpful: z.boolean(), comment: z.string().max(500).trim().optional() }),
]);

export async function saveLessonActivity(ctx: AppContext, body: unknown, ip: string) {
  const parsed = activity.safeParse(body);
  if (!parsed.success) throw new ServiceError("invalid_input", "Check your response. Comments can contain up to 500 characters.");
  const input = parsed.data;
  const { slug, version } = input;
  const tutorials = await loadTutorials();
  if (!tutorials.some((item) => item.slug === slug && item.version === version)) {
    throw new ServiceError("invalid_input", "Reload this lesson to respond to its current version.");
  }

  const name: EventName = input.kind === "feedback" ? "lesson_feedback" : "lesson_completed";
  const id = sha256(`${name}/${slug}/${version}/${input.submissionId}`);
  await ctx.db.transaction(async (tx) => {
    const inserted = await tx.insert(events).values({ id, name, props: { slug, version } })
      .onConflictDoNothing().returning({ id: events.id });
    if (!inserted.length) return; // An accepted retry consumes no additional quota.

    const subject = hmac(ctx.config.hashSecret, "subject", ip);
    const quota = await hitRateLimit(tx, `${name}:${subject}`, {
      windowSeconds: 3600, limit: input.kind === "feedback" ? ctx.config.limits.waitlistPerHour : 60, now: ctx.now(),
    });
    if (!quota.allowed) throw new ServiceError("rate_limited", "Too many responses from this connection. Try again later.", { retryAfterSeconds: quota.retryAfterSeconds });
    if (input.kind === "feedback") {
      await tx.insert(lessonFeedback).values({ eventId: id, helpful: input.helpful, comment: input.comment || null });
    }
  });
}
