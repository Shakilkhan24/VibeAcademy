import { describe, expect, it } from "vitest";
import { CRITICAL_CAP, SCORING_VERSION, bandFor, scoreClassification } from "@/domain/xray/scoring";
import { DECISIONS, NO_TRAITS, appliesTo } from "@/domain/taxonomy";
import { ALL_TRAITS, classification } from "../support/fixtures";

describe("scoreClassification", () => {
  it("scores 100 when every applicable decision is addressed", () => {
    const result = scoreClassification(classification({ traits: ALL_TRAITS, all: "addressed" }));
    expect(result.score).toBe(100);
    expect(result.silentCount).toBe(0);
    expect(result.band).toBe("senior-ready");
    expect(result.topRisks).toEqual([]);
    expect(result.version).toBe(SCORING_VERSION);
  });

  it("scores 0 when nothing is addressed", () => {
    const result = scoreClassification(classification({ traits: ALL_TRAITS }));
    expect(result.score).toBe(0);
    expect(result.silentCount).toBe(DECISIONS.length);
    expect(result.band).toBe("mostly-silent");
  });

  it("counts partial decisions as half", () => {
    const result = scoreClassification(classification({ traits: ALL_TRAITS, all: "partial" }));
    expect(result.uncappedScore).toBe(50);
    expect(result.partialCount).toBe(DECISIONS.length);
    expect(result.silentCount).toBe(0);
    // Partial critical decisions do not trigger the cap: something was said.
    expect(result.cap.applied).toBe(false);
  });

  it("ignores decisions that do not apply", () => {
    // A portfolio page: no traits. Only always-on decisions count.
    const c = classification({ all: "addressed" });
    for (const d of DECISIONS) if (d.appliesWhen) c.statuses[d.id] = "missing";
    const result = scoreClassification(c);
    expect(result.score).toBe(100);
    expect(result.applicableCount).toBe(DECISIONS.filter((d) => appliesTo(d, NO_TRAITS)).length);
  });

  it("caps the score when an applicable critical decision is missing", () => {
    const c = classification({ traits: ALL_TRAITS, all: "addressed", statuses: { "ro-backups": "missing" } });
    const result = scoreClassification(c);
    expect(result.uncappedScore).toBeGreaterThan(CRITICAL_CAP);
    expect(result.score).toBe(CRITICAL_CAP);
    expect(result.cap).toEqual({ applied: true, limit: CRITICAL_CAP, criticalMissing: ["ro-backups"] });
    expect(result.topRisks[0]).toBe("ro-backups");
  });

  it("does not cap for critical decisions that do not apply", () => {
    // No payments trait: cb-payments missing must not matter.
    const traits = { ...ALL_TRAITS, takesPayments: false };
    const c = classification({ traits, all: "addressed", statuses: { "cb-payments": "missing" } });
    expect(scoreClassification(c).score).toBe(100);
  });

  it("orders top risks: critical, then missing before partial, then weight", () => {
    const c = classification({ traits: ALL_TRAITS, all: "addressed", statuses: {
      "ps-success": "missing", // weight 1
      "da-database": "partial", // weight 3, not critical
      "ia-row-access": "partial", // critical but partial
      "ss-secrets": "missing", // critical, missing
      "be-validation": "missing", // weight 2
    } });
    expect(scoreClassification(c).topRisks).toEqual(["ss-secrets", "ia-row-access", "be-validation"]);
  });

  it("reports per-domain coverage and null for domains with nothing applicable", () => {
    const result = scoreClassification(classification({ all: "addressed" }));
    const deploy = result.domains.find((d) => d.domain === "deployment-cloud")!;
    expect(deploy.applicable).toBe(0);
    expect(deploy.ratio).toBeNull();
    const scope = result.domains.find((d) => d.domain === "product-scope")!;
    expect(scope.ratio).toBe(1);
    expect(result.domains).toHaveLength(12);
  });

  it("is deterministic", () => {
    const c = classification({ traits: ALL_TRAITS, statuses: { "ps-audience": "addressed", "da-database": "partial" } });
    expect(scoreClassification(c)).toEqual(scoreClassification(structuredClone(c)));
  });

  it("maps scores to bands at the documented thresholds", () => {
    expect(bandFor(39)).toBe("mostly-silent");
    expect(bandFor(40)).toBe("partly-decided");
    expect(bandFor(69)).toBe("partly-decided");
    expect(bandFor(70)).toBe("well-specified");
    expect(bandFor(90)).toBe("senior-ready");
  });
});
