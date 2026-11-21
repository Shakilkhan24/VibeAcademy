import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/page-intro";
import { TutorialBody } from "@/components/learn/tutorial-body";
import { LessonCompletion } from "@/components/learn/lesson-progress";
import { Tag } from "@/components/ui/tag";
import { loadCards } from "@/content";
import { loadTutorials } from "@/content/tutorials";
import { DEPTHS, getChapter } from "@/domain/taxonomy";

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;

export async function generateStaticParams() {
  return (await loadTutorials()).map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const lesson = (await loadTutorials()).find((item) => item.slug === slug);
  if (!lesson) notFound();
  return { title: lesson.title, description: lesson.summary, openGraph: { type: "article", title: lesson.title, description: lesson.summary } };
}

export default async function TutorialPage({ params }: Props) {
  const { slug } = await params;
  const [tutorials, cards] = await Promise.all([loadTutorials(), loadCards()]);
  const index = tutorials.findIndex((tutorial) => tutorial.slug === slug);
  const lesson = tutorials[index];
  if (!lesson) notFound();
  const chapter = getChapter(lesson.chapter);
  const previous = tutorials[index - 1];
  const next = tutorials[index + 1];
  const prerequisites = tutorials.filter((tutorial) => lesson.prerequisites.includes(tutorial.slug));
  const related = cards.filter((card) => lesson.relatedCards.includes(card.slug));
  return (
    <Container>
      <article className="mx-auto max-w-[64rem]">
        <header className="border-b border-line-strong pt-10 pb-8 sm:pt-16">
          <nav aria-label="Breadcrumb" className="flex gap-3 text-small text-chalk-dim">
            <Link href="/learn" className="underline">Learning path</Link><span aria-hidden="true">/</span>
            <Link href={`/learn#${chapter.id}`} className="underline">{chapter.name}</Link>
          </nav>
          <h1 className="mt-5 max-w-[23ch] text-h1">{lesson.title}</h1>
          <p className="mt-4 max-w-[60ch] text-body text-chalk-dim">{lesson.summary}</p>
          <div className="mt-5 flex flex-wrap items-center gap-3 text-small text-chalk-dim">
            <span>{DEPTHS.find((depth) => depth.id === lesson.level)?.name} depth</span>
            <span>{lesson.estimatedMinutes} min</span>
            <Tag tone={lesson.status === "draft" ? "dashed" : "plain"}>{lesson.status === "draft" ? "Draft" : "Reviewed"}</Tag>
          </div>
        </header>
        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-12">
          <aside className="space-y-6 border-l border-line-strong pl-4 text-small lg:sticky lg:top-8">
            {lesson.headings.length > 0 && <nav aria-label="On this page">
              <h2 className="font-medium">On this page</h2>
              <ul className="mt-3 space-y-2 text-chalk-dim">{lesson.headings.map((heading) => (
                <li key={heading.id} className={heading.level === 3 ? "pl-3" : undefined}><a className="underline" href={`#${heading.id}`}>{heading.text}</a></li>
              ))}</ul>
            </nav>}
            {prerequisites.length > 0 && <nav aria-label="Before this lesson">
              <h2 className="font-medium">Before this lesson</h2>
              <ul className="mt-2 space-y-2">{prerequisites.map((item) => <li key={item.slug}><Link className="text-chalk-dim underline" href={`/learn/${item.slug}`}>{item.title}</Link></li>)}</ul>
            </nav>}
          </aside>
          <div className="min-w-0">
            <TutorialBody html={lesson.html} />
            {related.length > 0 && <section className="sheet mt-10 p-5">
              <h2 className="text-h3">Decisions this tutorial covers</h2>
              <ul className="mt-3 space-y-2">{related.map((card) => <li key={card.slug}><Link className="text-pencil underline" href={`/cards/${card.slug}`}>{card.title}</Link></li>)}</ul>
            </section>}
            <LessonCompletion slug={lesson.slug} />
            <nav aria-label="Lesson navigation" className="mt-10 grid gap-5 border-t border-line-strong pt-5 sm:grid-cols-2">
              {previous && <Link href={`/learn/${previous.slug}`} className="underline"><span className="block text-small text-chalk-dim">Previous lesson</span>{previous.title}</Link>}
              {next ? <Link href={`/learn/${next.slug}`} className="underline"><span className="block text-small text-chalk-dim">Next lesson</span>{next.title}</Link> :
                <Link href="/learn" className="text-pencil underline">Back to the learning path</Link>}
            </nav>
          </div>
        </div>
      </article>
    </Container>
  );
}
