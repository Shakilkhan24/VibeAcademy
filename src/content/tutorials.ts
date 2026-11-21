import "server-only";
import MarkdownIt from "markdown-it";
import { parse } from "yaml";
import { TutorialMetadataSchema, type TutorialMetadata } from "@/domain/content/tutorial-schema";

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
