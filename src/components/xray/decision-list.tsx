import Link from "next/link";
import { DOMAINS, getDecision } from "@/domain/taxonomy";
import type { DecisionAssessment } from "@/domain/xray/scoring";

const STATUS = {
  addressed: { glyph: "■", label: "Decided", className: "text-pencil" },
  partial: { glyph: "◩", label: "Partly decided", className: "text-pencil/80" },
  missing: { glyph: "□", label: "Left to the AI", className: "text-chalk-dim" },
} as const;

/** Every decision in the taxonomy, grouped by domain, with its status for this prompt. */
export function DecisionList({ assessments }: { assessments: DecisionAssessment[] }) {
  const byId = new Map(assessments.map((a) => [a.decisionId, a]));
  return (
    <div className="border-t border-line">
      {DOMAINS.map((domain) => {
        const items = assessments.filter((a) => getDecision(a.decisionId)?.domain === domain.id);
        const relevant = items.filter((a) => a.applicable);
        const decided = relevant.filter((a) => a.status === "addressed").length;
        return (
          <details key={domain.id} className="group border-b border-line">
            <summary className="flex cursor-pointer list-none items-baseline justify-between gap-4 py-3 hover:text-chalk">
              <span className="font-medium">{domain.name}</span>
              <span className="text-micro text-chalk-dim">
                {relevant.length === 0 ? "Not needed for this app" : `${decided} of ${relevant.length} decided`}
                <span className="ml-3 inline-block transition-transform group-open:rotate-90" aria-hidden="true">›</span>
              </span>
            </summary>
            <ul className="pb-4">
              {items.map((a) => {
                const d = getDecision(a.decisionId)!;
                const s = STATUS[byId.get(d.id)!.status];
                return (
                  <li key={d.id} className={`flex gap-3 py-1.5 text-small ${a.applicable ? "" : "opacity-45"}`}>
                    <span aria-hidden="true" className={`w-4 shrink-0 ${a.applicable ? s.className : "text-chalk-dim"}`}>{a.applicable ? s.glyph : "–"}</span>
                    <span>
                      {d.question}{" "}
                      <span className="text-chalk-dim">
                        ({a.applicable ? s.label : "not needed for this app"}
                        {d.critical && a.applicable ? ", critical" : ""})
                      </span>
                      {d.cardSlug && a.applicable && a.status !== "addressed" ? (
                        <>
                          {" "}
                          <Link href={`/cards/${d.cardSlug}`} className="text-pencil underline">Card</Link>
                        </>
                      ) : null}
                    </span>
                  </li>
                );
              })}
            </ul>
          </details>
        );
      })}
    </div>
  );
}
