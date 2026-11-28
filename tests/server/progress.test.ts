import { describe, expect, it } from "vitest";
import { getLearner } from "@/server/auth";
import { events, lessonCompletions } from "@/server/db/schema";
import { getProgress, importProgress, markProgress } from "@/server/services/progress";
import { createTestContext } from "../support/test-context";
import { signInAs } from "../support/auth";

async function twoLearners() {
  const ctx = await createTestContext();
  const a = await signInAs(ctx, { email: "a@example.com" });
  const b = await signInAs(ctx, { email: "b@example.com" });
  return { ctx, a: (await getLearner(ctx.auth, a.headers))!, b: (await getLearner(ctx.auth, b.headers))! };
}

describe("saved lesson progress", () => {
  it("imports a partial checklist once, however often it is repeated", async () => {
    const { ctx, a } = await twoLearners();
    const first = await importProgress(ctx, a, { slugs: ["choose-one-job", "sketch-the-first-workflow", "choose-one-job"] });
    expect(first.imported).toBe(2);
    const again = await importProgress(ctx, a, { slugs: ["choose-one-job", "sketch-the-first-workflow"] });
    expect(again.imported).toBe(0);
    expect(again.completed.sort()).toEqual(["choose-one-job", "sketch-the-first-workflow"]);
    expect(await ctx.db.select().from(lessonCompletions)).toHaveLength(2);
  });

  it("merges with progress already saved on the account", async () => {
    const { ctx, a } = await twoLearners();
    await markProgress(ctx, a, { slug: "choose-one-job", done: true });
    const merged = await importProgress(ctx, a, { slugs: ["choose-one-job", "write-a-testable-build-prompt"] });
    expect(merged.imported).toBe(1);
    expect(merged.completed.sort()).toEqual(["choose-one-job", "write-a-testable-build-prompt"]);
  });

  it("accepts an empty checklist and skips lessons that no longer exist", async () => {
    const { ctx, a } = await twoLearners();
    expect(await importProgress(ctx, a, { slugs: [] })).toEqual({ completed: [], imported: 0 });
    expect((await importProgress(ctx, a, { slugs: ["a-retired-lesson", "choose-one-job"] })).completed).toEqual(["choose-one-job"]);
    await expect(importProgress(ctx, a, { slugs: ["Not a slug!"] })).rejects.toMatchObject({ code: "invalid_input" });
  });

  it("never adds analytics events, so imports cannot inflate public lesson counts", async () => {
    const { ctx, a } = await twoLearners();
    await importProgress(ctx, a, { slugs: ["choose-one-job", "sketch-the-first-workflow"] });
    await markProgress(ctx, a, { slug: "write-a-testable-build-prompt", done: true });
    expect(await ctx.db.select().from(events)).toHaveLength(0);
  });

  it("marks and unmarks a lesson", async () => {
    const { ctx, a } = await twoLearners();
    await markProgress(ctx, a, { slug: "choose-one-job", done: true });
    await markProgress(ctx, a, { slug: "choose-one-job", done: true });
    expect((await getProgress(ctx, a)).completed).toEqual(["choose-one-job"]);
    expect((await markProgress(ctx, a, { slug: "choose-one-job", done: false })).completed).toEqual([]);
    await expect(markProgress(ctx, a, { slug: "a-retired-lesson", done: true })).rejects.toMatchObject({ code: "not_found" });
  });
});

describe("two-user access: progress", () => {
  it("keeps A's and B's progress apart", async () => {
    const { ctx, a, b } = await twoLearners();
    await importProgress(ctx, a, { slugs: ["choose-one-job", "sketch-the-first-workflow"] });
    // A on a second device sees the same saved progress.
    expect((await getProgress(ctx, a)).completed.sort()).toEqual(["choose-one-job", "sketch-the-first-workflow"]);
    // B on the original browser sees only B's progress, and B's changes never touch A's rows.
    expect((await getProgress(ctx, b)).completed).toEqual([]);
    await markProgress(ctx, b, { slug: "choose-one-job", done: false });
    await markProgress(ctx, b, { slug: "write-a-testable-build-prompt", done: true });
    expect((await getProgress(ctx, a)).completed.sort()).toEqual(["choose-one-job", "sketch-the-first-workflow"]);
    expect((await getProgress(ctx, b)).completed).toEqual(["write-a-testable-build-prompt"]);
  });
});
