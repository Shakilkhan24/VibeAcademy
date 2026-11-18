import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadEpisodes, loadMethodology } from "@/content";
import { Container } from "@/components/layout/page-intro";
import { FightCard } from "@/components/lab/fight-card";
import { Notice } from "@/components/ui/notice";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export async function generateStaticParams() {
  return (await loadEpisodes()).map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const ep = (await loadEpisodes()).find((e) => e.slug === slug);
  return ep ? { title: `Lab episode ${ep.number}: ${ep.title}`, description: ep.idea } : {};
}

export default async function EpisodePage({ params }: Props) {
  const { slug } = await params;
  const [episodes, methodology] = await Promise.all([loadEpisodes(), loadMethodology()]);
  const ep = episodes.find((e) => e.slug === slug);
  if (!ep) notFound();

  return (
    <Container>
      <header className="pt-14 pb-10 sm:pt-20">
        <p className="text-small text-chalk-dim">Twin Builds Lab, episode {ep.number}</p>
        <h1 className="mt-3 max-w-[20ch] text-h1">{ep.title}</h1>
        <p className="mt-5 max-w-[60ch] text-chalk-dim">{ep.idea}</p>
        <p className="mt-3 text-small text-chalk-dim">Tool: {ep.tool}</p>
      </header>

      {ep.status !== "published" ? (
        <Notice title="No results yet" className="mb-10">
          This episode has not been built and tested yet. Results appear here only after both twins have been measured and the raw output is public.
        </Notice>
      ) : null}

      <section className="grid gap-6 md:grid-cols-2" aria-label="The twins">
        {[ep.twinA, ep.twinB].map((twin) => (
          <div key={twin.label} className="sheet p-5">
            <h2 className="text-h3">{twin.label}</h2>
            <p className="mt-2 text-small text-chalk-dim">{twin.approach}</p>
            {twin.liveUrl ? <p className="mt-3 text-small"><a href={twin.liveUrl} className="text-pencil underline" rel="noopener noreferrer">Live app</a></p> : null}
          </div>
        ))}
      </section>

      <section className="mt-12" aria-label="Results">
        <FightCard episode={ep} methodology={methodology} />
        {ep.findings.length > 0 ? (
          <ul className="mt-8 space-y-2 text-measure">
            {ep.findings.map((f) => <li key={f} className="border-l border-line-strong pl-4">{f}</li>)}
          </ul>
        ) : null}
        {ep.artifactsUrl ? <p className="mt-6 text-small"><a href={ep.artifactsUrl} className="text-pencil underline" rel="noopener noreferrer">Raw test output</a></p> : null}
      </section>
    </Container>
  );
}
