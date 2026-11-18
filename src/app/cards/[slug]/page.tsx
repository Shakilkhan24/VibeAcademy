import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCard, loadCards } from "@/content";
import { RANKS, getChapter, getDecision, getDomain } from "@/domain/taxonomy";
import { Container } from "@/components/layout/page-intro";
import { DepthDial } from "@/components/cards/depth-dial";
import { OptionSheet } from "@/components/cards/option-sheet";
import { Notice } from "@/components/ui/notice";
import { Prose } from "@/components/ui/prose";
import { Tag } from "@/components/ui/tag";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export async function generateStaticParams() {
  return (await loadCards()).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const card = await getCard((await params).slug);
  return card ? { title: card.title, description: card.question } : {};
}

export default async function CardPage({ params }: Props) {
  const card = await getCard((await params).slug);
  if (!card) notFound();
  const all = await loadCards();
  const related = card.related.map((slug) => all.find((c) => c.slug === slug)).filter((c) => c !== undefined);
  const rank = RANKS.find((r) => r.id === card.minRank)!;

  return (
    <Container>
      <article>
        <header className="pt-14 pb-10 sm:pt-20">
          <div className="flex flex-wrap gap-2">
            <Tag>Chapter: {getChapter(card.chapter).name}</Tag>
            <Tag>{getDomain(card.domain).name}</Tag>
            <Tag>From rank {rank.level}, {rank.name}</Tag>
            {card.status === "draft" ? <Tag tone="dashed">Draft</Tag> : null}
          </div>
          <h1 className="mt-5 max-w-[18ch] text-h1">{card.title}</h1>
          <p className="mt-5 max-w-[46ch] text-h3 font-display text-chalk-dim [font-stretch:108%]">{card.question}</p>
        </header>

        <section className="grid gap-8 md:grid-cols-2" aria-label="Why it matters">
          <div>
            <h2 className="text-h3">When this matters</h2>
            <Prose text={card.moment} className="mt-2 text-chalk-dim" />
          </div>
          <div className="border-l-2 border-redline pl-5">
            <h2 className="text-h3">If you stay silent</h2>
            <Prose text={card.ifSilent} className="mt-2 text-chalk-dim" />
          </div>
        </section>

        <section className="mt-16" aria-labelledby="options">
          <h2 id="options" className="text-h2">Your options</h2>
          <p className="mt-2 text-chalk-dim text-measure">Each option is a real choice with a real cost. Pick one, then paste its prompt line into your AI tool.</p>
          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            {card.options.map((option, i) => (
              <OptionSheet key={option.key} option={option} letter={String.fromCharCode(65 + i)} />
            ))}
          </div>
        </section>

        <section className="mt-16 grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <div aria-labelledby="deeper">
            <h2 id="deeper" className="text-h2">Go deeper</h2>
            <p className="mt-2 mb-5 text-chalk-dim">Turn the dial to read the same idea at a different depth.</p>
            <DepthDial depths={card.depths} />
          </div>
          <div aria-labelledby="prove">
            <h2 id="prove" className="text-h2">Prove it</h2>
            <p className="mt-2 text-chalk-dim">A check you can run on your own app.</p>
            <ol className="mt-5 list-decimal space-y-2 pl-5 text-small">
              {card.proveIt.steps.map((step) => <li key={step}>{step}</li>)}
            </ol>
            <p className="mt-5 border-l-2 border-pencil pl-4 text-small">
              <span className="font-medium">Pass when: </span>
              {card.proveIt.passWhen}
            </p>
          </div>
        </section>

        <footer className="mt-16 grid gap-8 border-t border-line pt-8 md:grid-cols-3">
          <div>
            <h2 className="text-h3">Decisions this card covers</h2>
            <ul className="mt-3 space-y-1 text-small text-chalk-dim">
              {card.decisionIds.map((id) => <li key={id}>{getDecision(id)?.question}</li>)}
            </ul>
          </div>
          <div>
            <h2 className="text-h3">Related cards</h2>
            <ul className="mt-3 space-y-1 text-small">
              {related.map((r) => (
                <li key={r.slug}><Link href={`/cards/${r.slug}`} className="text-pencil underline">{r.title}</Link></li>
              ))}
            </ul>
            {card.sources.length > 0 ? (
              <>
                <h2 className="mt-6 text-h3">Sources</h2>
                <ul className="mt-3 space-y-1 text-small">
                  {card.sources.map((s) => (
                    <li key={s.url}><a href={s.url} className="text-chalk-dim underline hover:text-chalk" rel="noopener noreferrer">{s.title}</a></li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>
          <div className="text-small text-chalk-dim">
            <h2 className="text-h3 text-chalk">About this card</h2>
            <p className="mt-3">Version {card.version}, updated {card.updated}.</p>
            {card.status === "draft" ? (
              <Notice className="mt-3" title="Draft">Written for review. It has not yet been checked by a second engineer.</Notice>
            ) : null}
          </div>
        </footer>
      </article>
    </Container>
  );
}
