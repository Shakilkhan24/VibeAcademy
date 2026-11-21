import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageIntro } from "@/components/layout/page-intro";
import { ButtonLink } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import { loadTutorials } from "@/content/tutorials";
import { CHAPTERS, DEPTHS } from "@/domain/taxonomy";

export const metadata: Metadata = {
  title: "Learning path",
  description: "Follow an app from its first idea through launch and growth, one engineering decision at a time.",
};

export default async function LearnPage() {
  const tutorials = await loadTutorials();
  const first = tutorials[0];
  return (
    <Container>
      <PageIntro title="The learning path">
        Follow the decisions an app needs as it grows. Start with Dream to turn an idea into a first build you can test.
      </PageIntro>
      <div className="grid items-start gap-10 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-16">
        <aside className="sheet p-5 lg:sticky lg:top-6">
          <nav aria-label="Chapters">
            <h2 className="text-h3">Chapters</h2>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-small marker:text-chalk-dim">
              {CHAPTERS.map((chapter) => <li key={chapter.id}><a className="underline" href={`#${chapter.id}`}>{chapter.name}</a></li>)}
            </ol>
          </nav>
        </aside>
        <div>
          {CHAPTERS.map((chapter) => {
            const lessons = tutorials.filter((tutorial) => tutorial.chapter === chapter.id);
            return (
              <section key={chapter.id} aria-labelledby={chapter.id} className="mb-10 border-t border-line-strong pt-5">
                <h2 id={chapter.id} className="scroll-mt-6 text-h2">{chapter.name}</h2>
                <p className="mt-2 text-chalk-dim">{chapter.moment}</p>
                {lessons.length ? (
                  <>
                    {first?.chapter === chapter.id && <ButtonLink href={`/learn/${first.slug}`} className="mt-5">Start the first lesson</ButtonLink>}
                    <ol className="mt-5 divide-y divide-line">
                      {lessons.map((lesson) => (
                        <li key={lesson.slug} className="py-5">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-small text-chalk-dim">
                            <span>{DEPTHS.find((depth) => depth.id === lesson.level)?.name}</span>
                            <span>{lesson.estimatedMinutes} min</span>
                            {lesson.status === "draft" && <Tag tone="dashed">Draft</Tag>}
                          </div>
                          <h3 className="mt-2 text-h3"><Link href={`/learn/${lesson.slug}`} className="underline decoration-line-strong hover:decoration-pencil">{lesson.title}</Link></h3>
                          <p className="mt-1 max-w-prose text-small text-chalk-dim">{lesson.summary}</p>
                        </li>
                      ))}
                    </ol>
                  </>
                ) : <p className="mt-3 text-small text-chalk-dim">No lessons yet.</p>}
              </section>
            );
          })}
        </div>
      </div>
    </Container>
  );
}
