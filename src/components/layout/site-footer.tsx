import Link from "next/link";
import { TAXONOMY_VERSION } from "@/domain/taxonomy";
import { SCORING_VERSION } from "@/domain/xray/scoring";

/**
 * Footer as a drawing title block. Every field is real: the versions shown are the ones the
 * X-Ray uses, so a screenshot of a result can always be traced to its rules.
 */
export function SiteFooter() {
  const cells: [string, string][] = [
    ["Project", "VibeAcademy"],
    ["Stage", "Phase 0, pre-launch"],
    ["Decision taxonomy", `v${TAXONOMY_VERSION}`],
    ["Scoring rules", `v${SCORING_VERSION}`],
  ];
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto grid max-w-[1200px] gap-8 px-5 py-10 sm:px-8 md:grid-cols-[1fr_auto]">
        <div className="text-small text-chalk-dim">
          <p className="text-chalk">Vibe like a beginner. Decide like a senior.</p>
          <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            <li><Link href="/privacy" className="hover:text-chalk">Privacy</Link></li>
            <li><Link href="/terms" className="hover:text-chalk">Terms</Link></li>
            <li><Link href="/open" className="hover:text-chalk">Open numbers</Link></li>
            <li><Link href="/lab" className="hover:text-chalk">How the Lab tests</Link></li>
          </ul>
        </div>
        <dl className="grid grid-cols-2 border border-line text-micro sm:min-w-[420px]" aria-label="Title block">
          {cells.map(([k, v]) => (
            <div key={k} className="border-b border-r border-line px-3 py-2 [&:nth-child(2n)]:border-r-0 [&:nth-last-child(-n+2)]:border-b-0">
              <dt className="text-chalk-dim">{k}</dt>
              <dd className="mt-0.5 text-chalk">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </footer>
  );
}
