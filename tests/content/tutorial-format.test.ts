import { describe, expect, it } from "vitest";
import { stringify } from "yaml";
import { parseTutorial } from "@/content/tutorials";
import { TutorialMetadataSchema } from "@/domain/content/tutorial-schema";

const metadata = {
  slug: "example-lesson",
  title: "Example lesson",
  summary: "A fixture for testing the tutorial format.",
  status: "draft",
  version: 1,
  updatedAt: "2026-11-21",
  chapter: "dream",
  domains: ["product-scope"],
  level: "practical",
  estimatedMinutes: 5,
};

function document(body: string) {
  return ["---", stringify(metadata).trimEnd(), "---", body].join("\n");
}

describe("tutorial format", () => {
  it("reads Markdown with YAML frontmatter, including Windows line endings", () => {
    const source = document("## A heading\n\nA *short* paragraph.\n\n---\n\nMore text.");
    const tutorial = parseTutorial("\uFEFF" + source.replaceAll("\n", "\r\n"));
    expect(tutorial).toMatchObject({ ...metadata, prerequisites: [], relatedCards: [] });
    expect(tutorial.html).toContain("<h2>A heading</h2>");
    expect(tutorial.html).toContain("<em>short</em>");
    expect(tutorial.html).toContain("<hr");
  });

  it.each([
    { chapter: "fundraising" }, { domains: ["marketing"] }, { level: "advanced" },
    { status: "published" }, { version: 0 }, { order: 1.5 }, { estimatedMinutes: -2 },
    { updatedAt: "2026-02-30" }, { slug: "../other" }, { relatedCards: ["two words"] },
  ])("rejects invalid metadata %o", (fields) => {
    expect(TutorialMetadataSchema.safeParse({ ...metadata, ...fields }).success).toBe(false);
  });

  it("reports missing delimiters, invalid YAML and empty lessons", () => {
    expect(() => parseTutorial("A lesson without metadata")).toThrow(/frontmatter/);
    expect(() => parseTutorial("---\nslug: open\n")).toThrow(/frontmatter/);
    expect(() => parseTutorial("---\ntitle: [\n---\nBody")).toThrow();
    expect(() => parseTutorial(document("  \n"))).toThrow(/body/);
  });

  it("renders HTML examples as text and keeps unsafe link destinations out of hrefs", () => {
    const tutorial = parseTutorial(document([
      "<button>Example</button>", "", "```html", "<b>Example</b>", "```", "",
      "[Example](javascript:void%200)", "", "[Reference](https://example.org/guide)",
    ].join("\n")));
    expect(tutorial.html).toContain("&lt;button&gt;Example&lt;/button&gt;");
    expect(tutorial.html).toContain('<code class="language-html">&lt;b&gt;Example&lt;/b&gt;');
    expect(tutorial.html).not.toContain('href="javascript:');
    expect(tutorial.html).toContain('href="https://example.org/guide"');
  });
});
