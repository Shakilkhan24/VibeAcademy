import type { Metadata } from "next";
import Link from "next/link";
import { loadEpisodes, loadMethodology } from "@/content";
import { Container, PageIntro } from "@/components/layout/page-intro";
import { FightCard } from "@/components/lab/fight-card";

export const metadata: Metadata = {
  title: "Twin Builds Lab",
  description: "The same app built twice, from a beginner prompt and from a SeniorSeat Blueprint, and tested the same way.",
};

export default async function LabPage() {
  const [methodology, episodes] = await Promise.all([loadMethodology(), loadEpisodes()]);

  return (
    <Container>
      <PageIntro title="Same idea, built twice, tested the same way">
        Claims about better software are cheap. The Lab builds one app from a typical beginner prompt and again from a SeniorSeat Blueprint, then
        runs both through identical tests and publishes every number with its raw output.
      </PageIntro>

      <section aria-labelledby="rules" className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <h2 id="rules" className="text-h2">The rules</h2>
          <ul className="mt-5 space-y-3 text-measure">
            {methodology.rules.map((rule) => (
              <li key={rule} className="border-l border-line-strong pl-4 text-chalk-dim">{rule}</li>
            ))}
          </ul>
          <p className="mt-6 text-small text-chalk-dim">Methodology v{methodology.version}, updated {methodology.updated}. The test scripts live in the repository&rsquo;s <code className="font-mono">lab/</code> folder.</p>
        </div>
        <div>
          <h2 className="text-h2">Episodes</h2>
          <ul className="mt-5 space-y-6">
            {episodes.map((ep) => (
              <li key={ep.slug}>
                <FightCard episode={ep} methodology={methodology} />
                <p className="mt-3 text-small">
                  <Link href={`/lab/${ep.slug}`} className="text-pencil underline">Episode details</Link>
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-20" aria-labelledby="metrics">
        <h2 id="metrics" className="text-h2">What is measured</h2>
        <div className="mt-6 overflow-x-auto border border-line">
          <table className="w-full min-w-[720px] border-collapse text-small">
            <thead>
              <tr className="border-b border-line text-left">
                <th scope="col" className="px-4 py-2.5 font-medium">Measure</th>
                <th scope="col" className="px-4 py-2.5 font-medium">How it is measured</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Tool</th>
              </tr>
            </thead>
            <tbody>
              {methodology.metrics.map((m) => (
                <tr key={m.id} className="border-b border-line align-top last:border-b-0">
                  <th scope="row" className="px-4 py-3 text-left font-normal">
                    {m.name}
                    <span className="block text-micro text-chalk-dim">{m.unit}, {m.betterWhen} is better</span>
                  </th>
                  <td className="px-4 py-3 text-chalk-dim">{m.howMeasured}</td>
                  <td className="px-4 py-3 text-chalk-dim">{m.tool}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </Container>
  );
}
