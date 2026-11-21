import "server-only";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "yaml";
import { CardSchema, type Card } from "@/domain/content/card-schema";
import { EpisodeSchema, MethodologySchema, type Episode, type Methodology } from "@/domain/content/lab-schema";
import { DECISIONS, DOMAIN_IDS, CHAPTER_IDS } from "@/domain/taxonomy";
import { checkTutorialLinks, loadTutorials } from "./tutorials";
import type { TutorialMetadata } from "@/domain/content/tutorial-schema";

/**
 * Content loaders. Cards and Lab files use YAML. Tutorials use Markdown with frontmatter.
 * Files in /content are versioned in Git and validated against schemas in src/domain/content.
 * Pages that use it are statically generated, so this runs at build time.
 */
const CONTENT_DIR = path.join(process.cwd(), "content");

async function readYamlDir<T>(dir: string, schema: { parse: (v: unknown) => T }): Promise<T[]> {
  const full = path.join(CONTENT_DIR, dir);
  const files = (await readdir(full)).filter((f) => f.endsWith(".yaml")).sort();
  return Promise.all(
    files.map(async (file) => {
      const raw = parse(await readFile(path.join(full, file), "utf8"));
      try {
        return schema.parse(raw);
      } catch (error) {
        throw new Error(`Invalid content in content/${dir}/${file}: ${error instanceof Error ? error.message : error}`);
      }
    }),
  );
}

let cardsPromise: Promise<Card[]> | undefined;

export function loadCards(): Promise<Card[]> {
  cardsPromise ??= readYamlDir("cards", CardSchema).then((cards) =>
    cards.sort(
      (a, b) =>
        CHAPTER_IDS.indexOf(a.chapter) - CHAPTER_IDS.indexOf(b.chapter) ||
        DOMAIN_IDS.indexOf(a.domain) - DOMAIN_IDS.indexOf(b.domain),
    ),
  );
  return cardsPromise;
}

export async function getCard(slug: string): Promise<Card | undefined> {
  return (await loadCards()).find((c) => c.slug === slug);
}

export async function loadMethodology(): Promise<Methodology> {
  const raw = parse(await readFile(path.join(CONTENT_DIR, "lab", "methodology.yaml"), "utf8"));
  return MethodologySchema.parse(raw);
}

export async function loadEpisodes(): Promise<Episode[]> {
  return (await readYamlDir("lab/episodes", EpisodeSchema)).sort((a, b) => a.number - b.number);
}

/**
 * Cross-file rules that a single schema cannot check. Returns problems instead of throwing,
 * so `pnpm content:check` can list them all at once.
 */
export async function checkContentIntegrity(tutorials?: readonly TutorialMetadata[]): Promise<string[]> {
  const problems: string[] = [];
  const cards = await loadCards();
  const slugs = new Set(cards.map((c) => c.slug));
  if (slugs.size !== cards.length) problems.push("Two cards share a slug.");

  for (const card of cards) {
    for (const rel of card.related) if (!slugs.has(rel)) problems.push(`${card.slug}: related card "${rel}" does not exist.`);
    for (const id of card.decisionIds) {
      const decision = DECISIONS.find((d) => d.id === id);
      if (decision?.cardSlug !== card.slug) problems.push(`${card.slug}: decision ${id} does not point back to this card (its cardSlug is "${decision?.cardSlug ?? "none"}").`);
    }
  }
  for (const d of DECISIONS) {
    if (!d.cardSlug) continue;
    const card = cards.find((c) => c.slug === d.cardSlug);
    if (!card) problems.push(`Decision ${d.id} points to missing card "${d.cardSlug}".`);
    else if (!card.decisionIds.includes(d.id)) problems.push(`Card ${card.slug} does not list decision ${d.id}, which points to it.`);
  }

  const methodology = await loadMethodology();
  for (const ep of await loadEpisodes()) {
    if (ep.methodologyVersion > methodology.version) problems.push(`Episode ${ep.slug} uses methodology v${ep.methodologyVersion}, which does not exist yet.`);
  }
  problems.push(...checkTutorialLinks(tutorials ?? await loadTutorials(), slugs));
  return problems;
}
