import Link from "next/link";
import { getDecision, getDomain } from "@/domain/taxonomy";
import { Tag } from "@/components/ui/tag";

/** The highest-priority decisions left open, most important first. */
export function RiskList({ ids, statuses }: { ids: string[]; statuses?: Record<string, string> }) {
  if (ids.length === 0) {
    return <p className="text-chalk-dim">No open risks: every relevant decision is made in the prompt.</p>;
  }
  return (
    <ol className="divide-y divide-line border-y border-line">
      {ids.map((id, i) => {
        const d = getDecision(id);
        if (!d) return null;
        const partly = statuses?.[id] === "partial";
        return (
          <li key={id} className="grid gap-3 py-5 sm:grid-cols-[2.5rem_1fr]">
            <span className="font-display text-h3 text-chalk-dim [font-stretch:110%]" aria-hidden="true">{i + 1}</span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-h3">{d.question}</h3>
                {d.critical ? <Tag tone="redline">Critical</Tag> : null}
                {partly ? <Tag tone="dashed">Partly decided</Tag> : null}
              </div>
              <p className="mt-2 text-measure text-chalk-dim">{d.risk}</p>
              <p className="mt-3 text-small">
                <span className="text-chalk-dim">{getDomain(d.domain).name}. </span>
                {d.cardSlug ? (
                  <Link href={`/cards/${d.cardSlug}`} className="text-pencil underline">
                    Learn this decision
                  </Link>
                ) : (
                  <span className="text-chalk-dim">Decision Card in progress.</span>
                )}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
