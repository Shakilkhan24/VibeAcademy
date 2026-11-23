import { describe, expect, it } from "vitest";
import { scoreClassification } from "@/domain/xray/scoring";
import { UPGRADE_HEADER, renderUpgradeText, upgradePrompt } from "@/domain/xray/prompt-upgrade";
import { renderAgentsMd, blueprintToBuildPackInput } from "@/domain/blueprint/build-pack";
import { getDecision } from "@/domain/taxonomy";
import { ALL_TRAITS, SHOP_PROMPT, classification } from "../support/fixtures";

describe("upgradePrompt", () => {
  it("keeps the learner's words first and appends only unresolved decisions", () => {
    const score = scoreClassification(classification({ traits: ALL_TRAITS, all: "addressed", statuses: { "ro-backups": "missing", "da-database": "partial" } }));
    const upgrade = upgradePrompt(`  ${SHOP_PROMPT}  `, score);
    expect(upgrade.text.startsWith(SHOP_PROMPT)).toBe(true);
    expect(upgrade.text).toContain(UPGRADE_HEADER);
    expect(upgrade.lines.map((l) => l.decisionId)).toEqual(["da-database", "ro-backups"]);
    expect(upgrade.text).toContain(getDecision("ro-backups")!.promptLine);
    expect(upgrade.lines[0]?.cardSlug).toBe("where-data-lives");
  });

  it("returns the prompt unchanged when nothing is missing", () => {
    const score = scoreClassification(classification({ traits: ALL_TRAITS, all: "addressed" }));
    expect(upgradePrompt(SHOP_PROMPT, score).text).toBe(SHOP_PROMPT);
  });

  it("groups lines under domain names in taxonomy order", () => {
    const score = scoreClassification(classification({ traits: ALL_TRAITS }));
    const { lines } = upgradePrompt(SHOP_PROMPT, score);
    const text = renderUpgradeText(SHOP_PROMPT, lines);
    expect(text.indexOf("Product and scope:")).toBeLessThan(text.indexOf("Cost and business:"));
  });

  it("never adds decisions that do not apply", () => {
    const score = scoreClassification(classification({}));
    const ids = upgradePrompt(SHOP_PROMPT, score).lines.map((l) => l.decisionId);
    expect(ids).not.toContain("cb-payments");
    expect(ids).toContain("ps-audience");
  });
});

describe("renderAgentsMd", () => {
  it("puts critical open decisions under non-negotiables and the rest under open decisions", () => {
    const md = renderAgentsMd({
      source: "xray",
      generatedAt: "2026-11-18T10:00:00.000Z",
      taxonomyVersion: 1,
      appType: "online-shop",
      decided: [{ decisionId: "ps-audience" }],
      open: ["ss-secrets", "fe-platform"],
    });
    expect(md).toContain("# AGENTS.md");
    expect(md).toContain("an online shop");
    expect(md).toContain("## Non-negotiables");
    expect(md).toContain(getDecision("ss-secrets")!.promptLine);
    expect(md).toContain("## Open decisions: ask me before choosing");
    expect(md).toContain(getDecision("fe-platform")!.question);
    expect(md).toContain("## Decisions already made");
  });

  it("renders a Blueprint with concrete choices and derives open decisions", () => {
    const input = blueprintToBuildPackInput(
      {
        projectId: "p1",
        name: "Candle shop",
        appType: "online-shop",
        traits: ALL_TRAITS,
        taxonomyVersion: 1,
        decisions: [{ decisionId: "da-database", promptLine: "Database: Postgres on Neon, in Frankfurt.", decidedAt: "2026-11-18" }],
      },
      "2026-11-18T10:00:00.000Z",
    );
    expect(input.open).not.toContain("da-database");
    expect(getDecision(input.open[0]!)!.critical).toBe(true);
    const md = renderAgentsMd(input);
    expect(md).toContain("Database: Postgres on Neon, in Frankfurt.");
    expect(md).toContain("Generated from your VibeAcademy Blueprint");
  });
});
