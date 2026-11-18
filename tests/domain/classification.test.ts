import { describe, expect, it } from "vitest";
import { ClassificationShapeError, normalizeClassification } from "@/domain/xray/classification";
import { DECISION_IDS } from "@/domain/taxonomy";

const base = {
  isSoftwareRequest: true,
  language: "en",
  appType: "online-shop",
  traits: { hasAccounts: true, takesPayments: true },
  decisions: [{ id: "ps-audience", status: "addressed" }],
};

describe("normalizeClassification", () => {
  it("fills every decision the model left out as missing", () => {
    const c = normalizeClassification(base);
    expect(Object.keys(c.statuses)).toHaveLength(DECISION_IDS.length);
    expect(c.statuses["ps-audience"]).toBe("addressed");
    expect(c.statuses["ro-backups"]).toBe("missing");
  });

  it("defaults absent traits to false", () => {
    const c = normalizeClassification(base);
    expect(c.traits.hasAccounts).toBe(true);
    expect(c.traits.hasServerData).toBe(false);
  });

  it("tolerates enum casing and unknown values", () => {
    const c = normalizeClassification({
      ...base,
      appType: "Online-Shop",
      decisions: [
        { id: "PS-AUDIENCE", status: "Partial" },
        { id: "made-up-id", status: "addressed" },
        { id: "da-database", status: "maybe" },
      ],
    });
    expect(c.appType).toBe("online-shop");
    expect(c.statuses["ps-audience"]).toBe("partial");
    expect(c.statuses["da-database"]).toBe("missing");
    expect("made-up-id" in c.statuses).toBe(false);
  });

  it("keeps the first status when an id repeats", () => {
    const c = normalizeClassification({ ...base, decisions: [{ id: "ps-audience", status: "missing" }, { id: "ps-audience", status: "addressed" }] });
    expect(c.statuses["ps-audience"]).toBe("missing");
  });

  it("maps an unknown app type to other and a bad language to und", () => {
    const c = normalizeClassification({ ...base, appType: "spaceship", language: "english!" });
    expect(c.appType).toBe("other");
    expect(c.language).toBe("und");
  });

  it("rejects a broken shape", () => {
    expect(() => normalizeClassification({ decisions: "nope" })).toThrow(ClassificationShapeError);
    expect(() => normalizeClassification(null)).toThrow(ClassificationShapeError);
  });
});
