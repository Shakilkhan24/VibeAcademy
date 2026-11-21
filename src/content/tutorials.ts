import "server-only";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import MarkdownIt from "markdown-it";
import { parse } from "yaml";
import { TutorialMetadataSchema, type TutorialMetadata } from "@/domain/content/tutorial-schema";
import { CHAPTER_IDS } from "@/domain/taxonomy";

const markdown = new MarkdownIt({ html: false });
const frontmatter = /^---[ \t]*\n([\s\S]*?)\n---[ \t]*(?:\n|$)/;

export interface Tutorial extends TutorialMetadata {
  html: string;
}

export function parseTutorial(source: string): Tutorial {
  const text = source.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const match = frontmatter.exec(text);
  if (!match) throw new Error("Start the tutorial with YAML frontmatter enclosed by two --- lines.");

  const metadata = TutorialMetadataSchema.parse(parse(match[1]!));
  const body = text.slice(match[0].length);
  if (!body.trim()) throw new Error("Write the tutorial body after the frontmatter.");
  return { ...metadata, html: markdown.render(body) };
}

export async function loadTutorials(): Promise<Tutorial[]> {
  const directory = path.join(process.cwd(), "content", "tutorials");
  const entries = await readdir(directory, { withFileTypes: true });
  const files = entries.filter((entry) => entry.isFile() && entry.name.endsWith(".md") && entry.name !== "_template.md");
  const tutorials = await Promise.all(files.map(async ({ name }) => {
    try {
      const tutorial = parseTutorial(await readFile(path.join(directory, name), "utf8"));
      if (name !== tutorial.slug + ".md") throw new Error("Use the frontmatter slug as the filename.");
      return tutorial;
    } catch (error) {
      throw new Error(`Invalid tutorial ${name}: ${error instanceof Error ? error.message : error}`, { cause: error });
    }
  }));
  return tutorials.sort((a, b) =>
    CHAPTER_IDS.indexOf(a.chapter) - CHAPTER_IDS.indexOf(b.chapter) ||
    (a.order ?? Infinity) - (b.order ?? Infinity) ||
    a.slug.localeCompare(b.slug, "en"),
  );
}

export function checkTutorialLinks(tutorials: readonly TutorialMetadata[], cardSlugs: ReadonlySet<string>): string[] {
  const problems: string[] = [];
  const lessons = new Map(tutorials.map((tutorial) => [tutorial.slug, tutorial]));
  const checked = new Set<string>();
  const visiting = new Set<string>();

  function checkPrerequisites(lesson: TutorialMetadata) {
    if (checked.has(lesson.slug)) return;
    visiting.add(lesson.slug);
    for (const slug of lesson.prerequisites) {
      const prerequisite = lessons.get(slug);
      if (!prerequisite) problems.push(`${lesson.slug}: prerequisite "${slug}" does not exist.`);
      else if (visiting.has(slug)) problems.push(`${lesson.slug}: prerequisite "${slug}" creates a circular dependency.`);
      else checkPrerequisites(prerequisite);
    }
    visiting.delete(lesson.slug);
    checked.add(lesson.slug);
  }

  for (const lesson of tutorials) {
    for (const slug of lesson.relatedCards) {
      if (!cardSlugs.has(slug)) problems.push(`${lesson.slug}: related card "${slug}" does not exist.`);
    }
    checkPrerequisites(lesson);
  }
  return problems;
}
