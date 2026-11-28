import "server-only";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { loadTutorials } from "@/content/tutorials";
import type { Learner } from "../auth";
import type { AppContext } from "../context";
import { lessonCompletions } from "../db/schema";
import { ServiceError } from "./errors";

/**
 * Saved lesson progress for signed-in learners. Every query is scoped to the learner's id.
 * These writes never add analytics events: importing old browser marks must not inflate the
 * public completion counts, which come only from /api/lessons/activity.
 */
const slug = z.string().regex(/^[a-z0-9-]+$/).max(100);
const ImportSchema = z.strictObject({ slugs: z.array(slug).max(200) });
const MarkSchema = z.strictObject({ slug, done: z.boolean() });

export interface ProgressView {
  completed: string[];
}

async function knownSlugs(): Promise<Set<string>> {
  return new Set((await loadTutorials()).map((t) => t.slug));
}

export async function getProgress(ctx: AppContext, learner: Learner): Promise<ProgressView> {
  const rows = await ctx.db
    .select({ slug: lessonCompletions.lessonSlug })
    .from(lessonCompletions)
    .where(eq(lessonCompletions.userId, learner.id))
    .orderBy(lessonCompletions.completedAt, lessonCompletions.lessonSlug);
  return { completed: rows.map((r) => r.slug) };
}

/** Merges completed lessons from a browser checklist. Repeating it changes nothing. */
export async function importProgress(ctx: AppContext, learner: Learner, body: unknown): Promise<ProgressView & { imported: number }> {
  const parsed = ImportSchema.safeParse(body);
  if (!parsed.success) throw new ServiceError("invalid_input", "That checklist could not be read. Reload the page to try again.");
  const known = await knownSlugs();
  // Lessons that were renamed or removed since the mark are skipped rather than failing the import.
  const slugs = [...new Set(parsed.data.slugs)].filter((s) => known.has(s));
  let imported = 0;
  if (slugs.length) {
    const now = ctx.now();
    const inserted = await ctx.db
      .insert(lessonCompletions)
      .values(slugs.map((lessonSlug) => ({ userId: learner.id, lessonSlug, completedAt: now })))
      .onConflictDoNothing()
      .returning({ slug: lessonCompletions.lessonSlug });
    imported = inserted.length;
  }
  return { ...(await getProgress(ctx, learner)), imported };
}

export async function markProgress(ctx: AppContext, learner: Learner, body: unknown): Promise<ProgressView> {
  const parsed = MarkSchema.safeParse(body);
  if (!parsed.success) throw new ServiceError("invalid_input", "Reload the lesson and try again.");
  const { slug: lessonSlug, done } = parsed.data;
  if (!(await knownSlugs()).has(lessonSlug)) throw new ServiceError("not_found", "That lesson no longer exists.");
  if (done) {
    await ctx.db.insert(lessonCompletions).values({ userId: learner.id, lessonSlug, completedAt: ctx.now() }).onConflictDoNothing();
  } else {
    await ctx.db.delete(lessonCompletions).where(and(eq(lessonCompletions.userId, learner.id), eq(lessonCompletions.lessonSlug, lessonSlug)));
  }
  return getProgress(ctx, learner);
}
