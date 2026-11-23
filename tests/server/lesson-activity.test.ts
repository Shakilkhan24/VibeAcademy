import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { events, lessonFeedback } from "@/server/db/schema";
import { saveLessonActivity } from "@/server/services/lesson-activity";
import { getOpenMetrics } from "@/server/services/open-metrics";
import { createTestContext } from "../support/test-context";
import { loadTutorials } from "@/content/tutorials";

async function lessonRef(index = 0) {
  const { slug, version } = (await loadTutorials())[index]!;
  return { slug, version };
}

describe("lesson activity", () => {
  it("commits one event per submission and keeps the comment separate", async () => {
    const ctx = await createTestContext();
    const lesson = await lessonRef();
    const ip = "192.0.2.10";
    const vote = { ...lesson, kind: "feedback", submissionId: randomUUID(), helpful: false, comment: " Private reader remark " };
    await Promise.all([saveLessonActivity(ctx, vote, ip), saveLessonActivity(ctx, vote, ip)]);
    const completion = { ...lesson, kind: "completed", submissionId: randomUUID() };
    await saveLessonActivity(ctx, completion, ip);
    await saveLessonActivity(ctx, completion, ip);
    const recorded = await ctx.db.select({ name: events.name, props: events.props }).from(events).orderBy(events.name);
    expect(recorded).toEqual([{ name: "lesson_completed", props: lesson }, { name: "lesson_feedback", props: lesson }]);
    expect(await ctx.db.select().from(lessonFeedback)).toEqual([{ eventId: expect.any(String), helpful: false, comment: "Private reader remark" }]);
  });

  it("rejects invalid versions, unknown lessons and oversized comments without recording anything", async () => {
    const ctx = await createTestContext();
    const vote = { ...await lessonRef(), kind: "feedback", helpful: true, submissionId: randomUUID() };
    for (const changes of [{ version: vote.version + 1 }, { slug: "absent-lesson" }, { comment: "a".repeat(501) }, { helpful: "yes" }]) {
      await expect(saveLessonActivity(ctx, { ...vote, ...changes }, "unknown")).rejects.toMatchObject({ code: "invalid_input" });
    }
    expect(await ctx.db.select().from(events)).toEqual([]);
    await saveLessonActivity(ctx, { ...vote, comment: "a".repeat(500) }, "unknown");
  });

  it("rolls back an incomplete feedback write", async () => {
    const ctx = await createTestContext();
    await ctx.db.execute(sql`alter table lesson_feedback rename to unavailable_feedback`);
    const vote = { ...await lessonRef(), kind: "feedback", helpful: true, submissionId: randomUUID() };
    await expect(saveLessonActivity(ctx, vote, "unknown")).rejects.toThrow();
    expect(await ctx.db.select().from(events)).toEqual([]);
  });

  it("gates each lesson at ten responses and counts completions separately", async () => {
    const ctx = await createTestContext();
    const first = await lessonRef();
    const second = await lessonRef(1);
    const vote = { ...first, kind: "feedback", helpful: true, comment: "Private only" };
    await saveLessonActivity(ctx, { ...first, kind: "completed", submissionId: randomUUID() }, "unknown");
    for (let i = 0; i < 9; i++) {
      await saveLessonActivity(ctx, { ...vote, helpful: i < 6, submissionId: randomUUID() }, `192.0.2.${i + 1}`);
    }
    await saveLessonActivity(ctx, { ...vote, ...second, submissionId: randomUUID() }, "unknown");
    expect((await getOpenMetrics(ctx)).lessons).toEqual([]);
    await saveLessonActivity(ctx, { ...vote, submissionId: randomUUID() }, "unknown");
    expect((await getOpenMetrics(ctx)).lessons).toEqual([{ slug: first.slug, completions: 1, responses: 10, helpfulRate: 0.7 }]);
  });
});
