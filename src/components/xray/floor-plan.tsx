import { DOMAINS, getDecision } from "@/domain/taxonomy";
import type { DomainCoverage } from "@/domain/xray/scoring";
import { cn } from "@/lib/cn";

/**
 * The twelve decision domains drawn as rooms of one floor plan. Walls are shared, like a real
 * plan. Before analysis every room is dashed (undecided). After analysis, pencil hatching fills
 * each room in proportion to how much of it the prompt decided.
 */
export function FloorPlan({
  coverage,
  state,
  criticalMissing = [],
  caption,
}: {
  coverage?: DomainCoverage[] | null;
  state: "ghost" | "scanning" | "resolved";
  criticalMissing?: string[];
  caption?: string;
}) {
  const byDomain = new Map((coverage ?? []).map((c) => [c.domain, c]));
  const criticalDomains = new Set(criticalMissing.map((id) => getDecision(id)?.domain));

  return (
    <figure className="w-full">
      <div className="relative overflow-hidden">
        <ol className="grid grid-cols-3 border-l border-t border-line-strong lg:grid-cols-4" aria-label="Decision coverage across twelve domains">
          {DOMAINS.map((domain, i) => {
            const c = byDomain.get(domain.id);
            const resolved = state === "resolved" && c;
            const notApplicable = resolved && c.ratio === null;
            const critical = resolved && criticalDomains.has(domain.id);
            const label = !resolved
              ? `${domain.name}: not analysed yet`
              : notApplicable
                ? `${domain.name}: not needed for this app`
                : `${domain.name}: ${c.addressed} decided, ${c.partial} partly decided, ${c.missing} left to the AI`;
            return (
              <li
                key={domain.id}
                aria-label={label}
                className={cn(
                  "relative min-h-[78px] border-b border-r border-line-strong p-2.5 sm:min-h-[92px] sm:p-3",
                  !resolved && "border-dashed",
                  critical && "shadow-[inset_3px_0_0_0_var(--color-redline)]",
                )}
              >
                {resolved && !notApplicable ? (
                  <span
                    aria-hidden="true"
                    className="room-fill hatch absolute inset-y-0 left-0 opacity-35"
                    style={{ width: `${Math.round((c.ratio ?? 0) * 100)}%`, ["--delay" as string]: `${i * 55}ms` }}
                  />
                ) : null}
                <span className="relative block font-display text-small font-[620] [font-stretch:112%]">{domain.shortName}</span>
                <span className="relative mt-2 block text-micro text-chalk-dim">
                  {!resolved ? (
                    <span className="opacity-70">Undecided</span>
                  ) : notApplicable ? (
                    "Not needed"
                  ) : (
                    <>
                      <span className="text-chalk">{c.addressed + c.partial}</span> of {c.applicable} touched
                      {critical ? <span className="mt-1 block text-redline">Critical gap</span> : null}
                    </>
                  )}
                </span>
              </li>
            );
          })}
        </ol>
        {state === "scanning" ? (
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="scan-line h-1/3 w-full bg-gradient-to-b from-transparent via-pencil/15 to-transparent" />
          </div>
        ) : null}
      </div>
      {caption ? <figcaption className="mt-3 text-micro text-chalk-dim">{caption}</figcaption> : null}
    </figure>
  );
}
