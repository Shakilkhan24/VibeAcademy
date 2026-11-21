import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { z } from "zod";
import { DECISIONS } from "@/domain/taxonomy";
import { DECISION_STATUSES } from "@/domain/xray/classification";
import { classifyWithRules } from "@/server/ai/providers/rules";

const criticalIds = DECISIONS.filter((d) => d.critical).map((d) => d.id);
const fixtureSchema = z.array(z.strictObject({
  prompt: z.string().min(20),
  expected: z.record(z.string(), z.enum(DECISION_STATUSES)),
})).min(20);
const fixtures = fixtureSchema.parse(parse(readFileSync(new URL("../fixtures/prompts/critical-decisions.yaml", import.meta.url), "utf8")));

describe("offline X-Ray agreement", () => {
  it.each([
    ["Build an inventory app using database transactions.", "missing"],
    ["Build Stripe checkout and verify email addresses on the server.", "partial"],
    ["Take payments through a verified webhook.", "partial"],
    ["Use Stripe checkout. Mark the order paid after a verified webhook.", "addressed"],
  ])("distinguishes payment confirmation in %s", (prompt, status) => {
    expect(classifyWithRules(prompt).decisions.find((d) => d.id === "cb-payments")?.status).toBe(status);
  });

  it("labels every critical decision and covers all three possible statuses", () => {
    expect(new Set(fixtures.map((fixture) => fixture.prompt)).size).toBe(fixtures.length);
    for (const fixture of fixtures) expect(Object.keys(fixture.expected).sort()).toEqual([...criticalIds].sort());
    for (const id of criticalIds) {
      expect(new Set(fixtures.map((fixture) => fixture.expected[id]))).toEqual(new Set(DECISION_STATUSES));
    }
  });

  it("agrees with at least 80% of the critical-decision labels", () => {
    const matches = new Map(criticalIds.map((id) => [id, 0]));
    const mismatches: string[] = [];
    for (const [index, fixture] of fixtures.entries()) {
      const actual = new Map(classifyWithRules(fixture.prompt).decisions.map((item) => [item.id, item.status]));
      for (const id of criticalIds) {
        if (actual.get(id) === fixture.expected[id]) matches.set(id, matches.get(id)! + 1);
        else mismatches.push(`Prompt ${index + 1}, ${id}: expected ${fixture.expected[id]}, got ${actual.get(id)}`);
      }
    }
    const matched = [...matches.values()].reduce((sum, value) => sum + value, 0);
    const total = fixtures.length * criticalIds.length;
    console.info(`Critical-decision agreement: ${matched}/${total} (${(100 * matched / total).toFixed(1)}%).`,
      Object.fromEntries(matches));
    expect(matched / total, mismatches.join("\n")).toBeGreaterThanOrEqual(0.8);
  });
});
