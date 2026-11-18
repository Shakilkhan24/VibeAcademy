import { describe, expect, it } from "vitest";
import { DECISIONS, DOMAINS, DOMAIN_IDS, NO_TRAITS, appliesTo, getDecision } from "@/domain/taxonomy";
import { ALL_TRAITS } from "../support/fixtures";

describe("taxonomy", () => {
  it("has exactly twelve domains in the product-defined order", () => {
    expect(DOMAINS.map((d) => d.id)).toEqual([...DOMAIN_IDS]);
    expect(DOMAINS).toHaveLength(12);
  });

  it("gives every domain three decisions", () => {
    for (const domain of DOMAINS) {
      expect(DECISIONS.filter((d) => d.domain === domain.id), domain.id).toHaveLength(3);
    }
  });

  it("uses unique, kebab-case decision ids", () => {
    const ids = DECISIONS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z]{2}-[a-z0-9-]+$/);
  });

  it("makes every critical decision weight 3", () => {
    for (const d of DECISIONS.filter((d) => d.critical)) expect(d.weight, d.id).toBe(3);
  });

  it("keeps prompt lines and risks as full sentences", () => {
    for (const d of DECISIONS) {
      expect(d.promptLine.length, d.id).toBeGreaterThan(30);
      expect(d.risk.endsWith("."), d.id).toBe(true);
      expect(d.question.endsWith("?"), d.id).toBe(true);
    }
  });

  it("applies always-on decisions to an app with no traits", () => {
    const always = DECISIONS.filter((d) => !d.appliesWhen);
    expect(always.length).toBeGreaterThan(0);
    for (const d of always) expect(appliesTo(d, NO_TRAITS)).toBe(true);
  });

  it("applies every decision when every trait is present", () => {
    for (const d of DECISIONS) expect(appliesTo(d, ALL_TRAITS), d.id).toBe(true);
  });

  it("supports any-of applicability (secrets apply to payments without a server)", () => {
    const secrets = getDecision("ss-secrets")!;
    expect(appliesTo(secrets, { ...NO_TRAITS, takesPayments: true })).toBe(true);
    expect(appliesTo(secrets, NO_TRAITS)).toBe(false);
  });

  it("requires all-of traits (row access needs accounts AND saved data)", () => {
    const rows = getDecision("ia-row-access")!;
    expect(appliesTo(rows, { ...NO_TRAITS, hasAccounts: true })).toBe(false);
    expect(appliesTo(rows, { ...NO_TRAITS, hasAccounts: true, hasServerData: true })).toBe(true);
  });
});
