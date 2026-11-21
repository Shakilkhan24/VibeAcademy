import { z } from "zod";
import { CHAPTER_IDS, DEPTH_IDS, DOMAIN_IDS } from "../taxonomy";

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a lowercase, hyphenated slug.");
const title = z.string().trim().min(1);

/** YAML frontmatter shared by the learning path, reader and content checker. */
export const TutorialMetadataSchema = z.strictObject({
  slug,
  title,
  summary: z.string().trim().min(1),
  status: z.enum(["draft", "reviewed"]),
  version: z.number().int().positive(),
  updatedAt: z.iso.date(),
  chapter: z.enum(CHAPTER_IDS),
  order: z.number().int().positive().optional(),
  domains: z.array(z.enum(DOMAIN_IDS)).min(1),
  level: z.enum(DEPTH_IDS),
  estimatedMinutes: z.number().int().positive(),
  prerequisites: z.array(slug).default([]),
  relatedCards: z.array(slug).default([]),
});

export type TutorialMetadata = z.infer<typeof TutorialMetadataSchema>;

export interface TutorialHeading {
  id: string;
  text: string;
  level: number;
}
