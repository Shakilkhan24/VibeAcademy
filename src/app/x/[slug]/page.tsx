import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAppContext } from "@/server/context";
import { getSharedSummary } from "@/server/services/xray";
import { SCORE_BANDS } from "@/domain/xray/scoring";
import { Container } from "@/components/layout/page-intro";
import { FloorPlan } from "@/components/xray/floor-plan";
import { RiskList } from "@/components/xray/risk-list";
import { ScoreScale } from "@/components/xray/score-scale";
import { ButtonLink } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  const ctx = await getAppContext();
  return getSharedSummary(ctx, slug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const summary = await load((await params).slug);
  if (!summary) return { title: "X-Ray not found", robots: { index: false } };
  const band = SCORE_BANDS.find((b) => b.id === summary.band)?.label ?? "";
  return {
    title: `A Prompt X-Ray: ${summary.score}/100`,
    description: `${band}. ${summary.silentCount} decisions left to the AI. Run your own free Prompt X-Ray on VibeAcademy.`,
    robots: { index: false, follow: true },
  };
}

export default async function SharedXRayPage({ params }: Props) {
  const summary = await load((await params).slug);
  if (!summary) notFound();

  return (
    <Container>
      <div className="pt-14 pb-8 sm:pt-20">
        <p className="text-small text-chalk-dim">
          A shared Prompt X-Ray from {new Date(summary.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
        </p>
        <h1 className="mt-3 max-w-[20ch] text-h1">{summary.silentCount} decisions left to the AI</h1>
        <p className="mt-4 max-w-[56ch] text-chalk-dim">
          This page shows the score and coverage only. The original prompt was never stored, so it cannot be shown here.
        </p>
      </div>

      {summary.mode === "rules" ? (
        <Notice tone="caveat" title="Rule-based check" className="mb-10">
          This result came from VibeAcademy&rsquo;s rule-based check (keyword rules), not from AI analysis.
        </Notice>
      ) : null}

      <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
        <ScoreScale score={summary.score} band={summary.band} capLimit={summary.capApplied ? 60 : undefined} />
        <FloorPlan state="resolved" coverage={summary.domains} criticalMissing={summary.criticalMissing} />
      </div>

      <section className="mt-16" aria-labelledby="risks">
        <h2 id="risks" className="text-h2">The decisions that will hurt first</h2>
        <div className="mt-6">
          <RiskList ids={summary.topRisks} />
        </div>
      </section>

      <section className="mt-16 sheet p-6 sm:p-8">
        <h2 className="text-h2">What would your prompt score?</h2>
        <p className="mt-3 max-w-[56ch] text-chalk-dim">Free, and your prompt is never stored.</p>
        <div className="mt-6">
          <ButtonLink href="/xray">Run your own X-Ray</ButtonLink>
        </div>
      </section>
    </Container>
  );
}
