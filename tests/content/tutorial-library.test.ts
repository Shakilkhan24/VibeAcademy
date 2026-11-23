import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkTutorialLinks, loadTutorials, parseTutorial } from "@/content/tutorials";

const template = await readFile(path.join(process.cwd(), "content/tutorials/_template.md"), "utf8");
const metadata = parseTutorial(template);

describe("tutorial library", () => {
  let directory: string;
  let root: string;
  beforeEach(async () => {
    root = await mkdtemp(path.join(tmpdir(), "vibeacademy-lessons-"));
    directory = path.join(root, "content", "tutorials");
    await mkdir(directory, { recursive: true });
    vi.spyOn(process, "cwd").mockReturnValue(root);
  });
  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(root, { recursive: true, force: true });
  });

  function writeLesson(slug: string, chapter = "dream", order?: number) {
    const text = template.replace("slug: replace-with-your-slug", `slug: ${slug}`)
      .replace("chapter: dream", `chapter: ${chapter}${order === undefined ? "" : "\norder: " + order}`);
    return writeFile(path.join(directory, slug + ".md"), text);
  }

  it("checks the starter's format and excludes it from the learning path", async () => {
    expect(metadata.status).toBe("draft");
    await writeFile(path.join(directory, "_template.md"), template);
    expect(await loadTutorials()).toEqual([]);
  });

  it("orders files by chapter, explicit order and slug", async () => {
    await Promise.all([writeLesson("last", "launch"), writeLesson("beta"), writeLesson("alpha"),
      writeLesson("second", "dream", 2), writeLesson("first", "dream", 1)]);
    expect((await loadTutorials()).map((lesson) => lesson.slug)).toEqual([
      "first", "second", "alpha", "beta", "last",
    ]);
  });

  it("identifies the file that has invalid content or a mismatched slug", async () => {
    const filename = path.join(directory, "lesson.md");
    await writeFile(filename, "no metadata");
    await expect(loadTutorials()).rejects.toThrow(/lesson\.md.*frontmatter/);
    await writeFile(filename, template);
    await expect(loadTutorials()).rejects.toThrow(/lesson\.md.*filename/);
  });

  it("finds missing cards, missing lessons and prerequisite cycles", () => {
    const lessons = [
      { ...metadata, slug: "a", prerequisites: ["b"], relatedCards: ["missing-card"] },
      { ...metadata, slug: "b", prerequisites: ["a", "missing-lesson"] },
    ];
    const problems = checkTutorialLinks(lessons, new Set());
    expect(problems).toHaveLength(3);
    expect(problems.join("\n")).toMatch(/missing-card/);
    expect(problems.join("\n")).toMatch(/missing-lesson/);
    expect(problems.join("\n")).toMatch(/circular/);
  });

  it("accepts shared prerequisites and links to existing cards", () => {
    const lessons = [
      { ...metadata, slug: "a", prerequisites: ["b", "c"], relatedCards: ["one-job"] },
      { ...metadata, slug: "b", prerequisites: ["c"] },
      { ...metadata, slug: "c" },
    ];
    expect(checkTutorialLinks(lessons, new Set(["one-job"]))).toEqual([]);
  });
});
