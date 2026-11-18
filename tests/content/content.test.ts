import { describe, expect, it } from "vitest";
import { checkContentIntegrity, loadCards, loadEpisodes, loadMethodology } from "@/content";
import { EpisodeSchema } from "@/domain/content/lab-schema";
import { DECISIONS } from "@/domain/taxonomy";

describe("content", () => {
  it("loads five valid Decision Cards with all eight parts and five depths", async () => {
    const cards = await loadCards();
    expect(cards).toHaveLength(5);
    for (const card of cards) {
      expect(card.options.length, card.slug).toBeGreaterThanOrEqual(2);
      expect(card.options.filter((o) => o.recommended), card.slug).toHaveLength(1);
      expect(Object.keys(card.depths)).toEqual(["story", "practical", "technical", "engineer", "senior"]);
      expect(card.proveIt.steps.length).toBeGreaterThan(0);
    }
  });

  it("covers five different App Life Path chapters", async () => {
    const chapters = new Set((await loadCards()).map((c) => c.chapter));
    expect(chapters.size).toBe(5);
  });

  it("links every critical decision to a card", () => {
    for (const d of DECISIONS.filter((d) => d.critical && d.id !== "cb-payments")) {
      expect(d.cardSlug, d.id).toBeTruthy();
    }
  });

  it("has no broken links between cards, decisions and lab content", async () => {
    expect(await checkContentIntegrity()).toEqual([]);
  });

  it("defines all lab metrics and keeps unpublished episodes free of numbers", async () => {
    const m = await loadMethodology();
    expect(m.metrics).toHaveLength(11);
    const episodes = await loadEpisodes();
    expect(episodes.length).toBeGreaterThan(0);
    for (const ep of episodes) {
      if (ep.status !== "published") expect(ep.measurements).toEqual([]);
    }
  });

  it("refuses to publish an episode without every measurement and raw artifacts", () => {
    const result = EpisodeSchema.safeParse({
      slug: "x", number: 9, title: "t", idea: "an idea that is long enough", tool: "Lovable", status: "published", methodologyVersion: 1,
      twinA: { label: "A", approach: "approach text" }, twinB: { label: "B", approach: "approach text" },
      measurements: [{ metric: "prompts-used", twinA: 40, twinB: 12 }],
    });
    expect(result.success).toBe(false);
  });
});
