import Link from "next/link";
import { loadCards, loadEpisodes } from "@/content";
import { DECISIONS, getChapter, getDecision, getDomain } from "@/domain/taxonomy";
import { Container } from "@/components/layout/page-intro";
import { FloorPlan } from "@/components/xray/floor-plan";
import { XRayLauncher } from "@/components/xray/xray-launcher";
import { WaitlistForm } from "@/components/waitlist/waitlist-form";
import { ButtonLink } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";

const EXAMPLE_SILENT = ["ia-row-access", "ss-secrets", "ro-backups"] as const;

export default async function HomePage() {
  const cards = await loadCards();
  const episodes = await loadEpisodes();
  const firstEpisode = episodes[0];

  return (
    <>
      <Container>
        <section className="pt-14 pb-20 sm:pt-20">
          <p className="text-small text-chalk-dim">Vibe like a beginner. Decide like a senior.</p>
          <h1 className="mt-4 max-w-[21ch] text-h1">Every prompt hides decisions. Make them before the AI does.</h1>
          <p className="mt-6 max-w-[60ch] text-chalk-dim">
            SeniorSeat shows you which engineering decisions your prompt leaves to the AI, and teaches each one at your level, at the moment your app
            needs it. Start by X-raying a prompt.
          </p>
          <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
            <XRayLauncher />
            <FloorPlan state="ghost" caption="Twelve decision domains, drawn as rooms. A vague prompt leaves every one of them undecided." />
          </div>
        </section>
      </Container>

      <section className="border-y border-line bg-paper-deep/60">
        <Container className="grid gap-10 py-16 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div>
            <h2 className="text-h2">A vague prompt does not make the AI do less. It makes the AI decide for you.</h2>
            <p className="mt-4 text-chalk-dim text-measure">
              &ldquo;Build me an online shop where customers sign up and pay&rdquo; reads like one request. Underneath it sit dozens of choices:
              where the data lives, who may see it, where the keys go, what happens when it breaks. Say nothing, and the AI fills each gap with a
              guess you never see.
            </p>
          </div>
          <ul className="divide-y divide-line border-y border-line">
            {EXAMPLE_SILENT.map((id) => {
              const d = getDecision(id)!;
              return (
                <li key={id} className="grid gap-1 py-4 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] sm:gap-6">
                  <p className="font-medium">{d.question}</p>
                  <p className="text-small text-chalk-dim">{d.risk}</p>
                </li>
              );
            })}
          </ul>
        </Container>
      </section>

      <Container>
        <section className="py-20" aria-labelledby="how-heading">
          <h2 id="how-heading" className="max-w-[24ch] text-h2">How SeniorSeat turns a vibe into a plan</h2>
          <ol className="mt-10 grid gap-px border border-line bg-line md:grid-cols-4">
            {[
              { title: "X-ray the prompt", body: `See which of ${DECISIONS.length} decisions your prompt makes, which it skips, and which will hurt first.`, now: true },
              { title: "Learn the decision", body: "Each decision is a short card: the options, what each costs, and the exact line to tell your AI.", now: true },
              { title: "Build the Blueprint", body: "Your choices collect into a spec and an AGENTS.md file your AI tool follows every session.", now: false },
              { title: "Prove it", body: "Check your live app and watch your score improve, with evidence instead of promises.", now: false },
            ].map((step, i) => (
              <li key={step.title} className="bg-paper p-5">
                <p className="font-display text-h2 text-chalk-dim [font-stretch:115%]">{i + 1}</p>
                <h3 className="mt-3 text-h3">{step.title}</h3>
                <p className="mt-2 text-small text-chalk-dim">{step.body}</p>
                <p className="mt-4">{step.now ? <Tag tone="pencil">Available now</Tag> : <Tag tone="dashed">Coming next</Tag>}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="pb-20" aria-labelledby="cards-heading">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 id="cards-heading" className="text-h2">Decision Cards</h2>
              <p className="mt-2 max-w-[56ch] text-chalk-dim">Five cards so far, one for each early chapter of an app&rsquo;s life. Each explains one decision at five depths, from an everyday story to senior trade-offs.</p>
            </div>
            <ButtonLink href="/cards" variant="secondary">See the App Life Path</ButtonLink>
          </div>
          <ul className="mt-8 border-t border-line">
            {cards.map((card) => (
              <li key={card.slug} className="border-b border-line">
                <Link href={`/cards/${card.slug}`} className="grid gap-1 py-4 no-underline hover:bg-paper-raised/40 sm:grid-cols-[10rem_minmax(0,1fr)_auto] sm:items-baseline sm:gap-6 sm:px-2">
                  <span className="text-small text-chalk-dim">{getChapter(card.chapter).name}</span>
                  <span className="font-display text-h3 [font-stretch:110%]">{card.title}</span>
                  <span className="text-small text-chalk-dim">{getDomain(card.domain).name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="grid gap-10 pb-20 lg:grid-cols-2" aria-labelledby="lab-heading">
          <div>
            <h2 id="lab-heading" className="text-h2">Same idea. Built twice. Tested the same way.</h2>
            <p className="mt-4 text-chalk-dim text-measure">
              In the Twin Builds Lab, one app is built from a typical beginner prompt and again from a SeniorSeat Blueprint. Both face identical load,
              security, recovery and cost tests, and every number links to raw output.
            </p>
            <div className="mt-6">
              <ButtonLink href="/lab" variant="secondary">How the Lab tests</ButtonLink>
            </div>
          </div>
          {firstEpisode ? (
            <div className="sheet p-5">
              <p className="text-small text-chalk-dim">Episode {firstEpisode.number}</p>
              <p className="mt-1 font-display text-h3 [font-stretch:110%]">{firstEpisode.title}</p>
              <p className="mt-3 text-small text-chalk-dim">{firstEpisode.idea}</p>
              <p className="mt-4"><Tag tone="dashed">Planned: no results yet</Tag></p>
            </div>
          ) : null}
        </section>

        <section id="waitlist" className="sheet p-6 sm:p-10" aria-labelledby="wl-heading">
          <h2 id="wl-heading" className="text-h2">Get in first</h2>
          <p className="mt-3 mb-8 max-w-[56ch] text-chalk-dim">The full learning path, Blueprints and Build Packs are next. Join the waitlist and we will email you once, when it opens.</p>
          <WaitlistForm source="home" />
        </section>
      </Container>
    </>
  );
}
