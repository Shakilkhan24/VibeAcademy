import type { Metadata } from "next";
import { getAppContext } from "@/server/context";
import { getOpenMetrics } from "@/server/services/open-metrics";
import { Container, PageIntro } from "@/components/layout/page-intro";
import { Notice } from "@/components/ui/notice";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Open numbers",
  description: "SeniorSeat's live usage, AI spend and limits, computed from the production database.",
};

const usd = (n: number) => (n === 0 ? "$0" : n < 0.01 ? `$${n.toFixed(5)}` : `$${n.toFixed(2)}`);
const pct = (n: number | null) => (n === null ? "No data yet" : `${Math.round(n * 100)}%`);

export default async function OpenPage() {
  const ctx = await getAppContext();
  const m = await getOpenMetrics(ctx);

  const rows: { label: string; value: string; how: string }[] = [
    { label: "Prompt X-Rays run", value: m.xrayTotal.toLocaleString("en-US"), how: m.firstRunAt ? `Stored analyses since ${m.firstRunAt.slice(0, 10)}. Results deleted by their owners are not counted.` : "None yet." },
    { label: "X-Rays in the last 30 days", value: m.xrayLast30Days.toLocaleString("en-US"), how: "Count of stored analyses created in the last 30 days." },
    { label: "Rule-based X-Rays", value: m.rulesRuns.toLocaleString("en-US"), how: "Runs scored by keyword rules, not AI. They are labelled as rule-based everywhere." },
    { label: "Results shared by their owners", value: m.sharedRuns.toLocaleString("en-US"), how: "Sharing is opt-in and never includes the prompt." },
    { label: "AI requests in the last 30 days", value: m.aiRequestsLast30Days.toLocaleString("en-US"), how: "Every request through the AI gateway, including cache hits and failures." },
    { label: "Served from cache", value: pct(m.cacheHitRateLast30Days), how: "Identical prompts reuse a stored classification at no cost." },
    { label: "AI spend this month", value: usd(m.aiSpendThisMonthUsd), how: "Sum of the usage ledger, priced from the provider's published per-token rates." },
    { label: "Average cost of a paid AI call", value: m.avgCostPerPaidCallUsd === null ? "No paid calls yet" : usd(m.avgCostPerPaidCallUsd), how: "This month's AI spend divided by calls that cost money." },
    { label: "Daily AI spending cap", value: usd(m.dailyBudgetUsd), how: "Analysis pauses until 00:00 UTC once this is reached." },
    { label: "Waitlist", value: m.waitlistCount.toLocaleString("en-US"), how: "People who asked to be emailed at launch." },
    { label: "Waitlist sign-ups per day", value: m.waitlistSignupsPerDay.toLocaleString("en-US", { maximumFractionDigits: 2 }), how: "New sign-up events in the last 30 days divided by 30. A repeat submission from the same email counts once." },
    { label: "Waitlist sign-ups per 100 X-Rays", value: m.xraySignupsPerHundredRuns?.toLocaleString("en-US", { maximumFractionDigits: 1 }) ?? "Unavailable", how: "Sign-ups from the X-Ray result link per 100 completed checks in the same 30 days. This needs at least one check and source information for every sign-up." },
  ];

  return (
    <Container>
      <PageIntro title="Open numbers">
        SeniorSeat teaches people to measure what they build, so we publish what we measure. Every figure below is computed live from our own
        database when you load the page.
      </PageIntro>

      {m.analysisMode !== "ai" ? (
        <Notice tone="caveat" title={m.analysisMode === "rules" ? "X-Rays here use the rule-based check" : "The X-Ray is switched off on this server"} className="mb-8">
          {m.analysisMode === "rules"
            ? "AI-assisted analysis is not switched on yet, so the AI figures below stay at zero by design."
            : "The analysis engine is misconfigured, so the X-Ray cannot run here."}
        </Notice>
      ) : null}

      <div role="region" aria-label="Public metrics" tabIndex={0} className="overflow-x-auto border border-line">
        <table className="w-full min-w-[640px] border-collapse">
          <thead>
            <tr className="border-b border-line text-left text-small">
              <th scope="col" className="px-4 py-2.5 font-medium">Measure</th>
              <th scope="col" className="px-4 py-2.5 font-medium">Value</th>
              <th scope="col" className="px-4 py-2.5 font-medium">How it is computed</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-b border-line align-top last:border-b-0">
                <th scope="row" className="px-4 py-3 text-left font-normal">{r.label}</th>
                <td className="px-4 py-3 font-display text-h3 [font-stretch:112%] whitespace-nowrap">{r.value}</td>
                <td className="px-4 py-3 text-small text-chalk-dim">{r.how}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="mt-12 grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="text-h3">Not measured yet</h2>
          <ul className="mt-3 space-y-2 text-small text-chalk-dim">
            <li>Uptime and response times: arrive with the monitoring set-up before launch.</li>
            <li>The monthly cloud bill: published from the first full month after launch.</li>
          </ul>
        </div>
        <p className="text-small text-chalk-dim">Page generated {m.generatedAt.replace("T", " ").slice(0, 16)} UTC.</p>
      </section>
    </Container>
  );
}
