import type { Metadata } from "next";
import Link from "next/link";
import { loadCards } from "@/content";
import { CHAPTERS, getDomain } from "@/domain/taxonomy";
import { Container, PageIntro } from "@/components/layout/page-intro";
import { Tag } from "@/components/ui/tag";

export const metadata: Metadata = {
  title: "Decision Cards: the App Life Path",
  description: "Engineering decisions in the order your app meets them, each explained at five depths.",
};

/**
 * The App Life Path: chapters of an app's life as a drawn route. Cards hang off the chapter
 * where the decision becomes urgent. Chapters without cards yet say so plainly.
 */
export default async function CardsPage() {
  const cards = await loadCards();

  return (
    <Container>
      <PageIntro title="Decisions in the order your app meets them">
        Apps meet the same decisions at the same moments: data before the first build, access before the first users, backups before the first
        lost order. Each card arrives at its moment, at the depth you choose.
      </PageIntro>

      <ol className="relative ml-2 border-l border-dashed border-line-strong pb-4">
        {CHAPTERS.map((chapter, i) => {
          const inChapter = cards.filter((c) => c.chapter === chapter.id);
          return (
            <li key={chapter.id} className="relative pb-12 pl-8 last:pb-0">
              <span
                aria-hidden="true"
                className={`absolute top-1.5 -left-[7px] size-3.5 rotate-45 border ${inChapter.length ? "border-pencil bg-pencil" : "border-chalk-dim bg-paper"}`}
              />
              <p className="text-small text-chalk-dim">Chapter {i + 1}</p>
              <h2 className="text-h2">{chapter.name}</h2>
              <p className="mt-1 text-chalk-dim">{chapter.moment}</p>
              {inChapter.length > 0 ? (
                <ul className="mt-4 grid gap-3 md:grid-cols-2">
                  {inChapter.map((card) => (
                    <li key={card.slug}>
                      <Link href={`/cards/${card.slug}`} className="sheet block p-4 no-underline hover:bg-paper-raised/50">
                        <span className="block font-display text-h3 [font-stretch:110%]">{card.title}</span>
                        <span className="mt-1 block text-small text-chalk-dim">{card.question}</span>
                        <span className="mt-3 flex flex-wrap gap-2">
                          <Tag>{getDomain(card.domain).name}</Tag>
                          {card.status === "draft" ? <Tag tone="dashed">Draft</Tag> : null}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-small text-chalk-dim">Cards for this chapter arrive with the full learning path.</p>
              )}
            </li>
          );
        })}
      </ol>
    </Container>
  );
}
