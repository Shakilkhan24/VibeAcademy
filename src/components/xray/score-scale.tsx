import { SCORE_BANDS, type ScoreBandId } from "@/domain/xray/scoring";

/**
 * The score drawn as a dimension line: a 0-100 scale with the four bands marked, and a pencil
 * marker at the score. The cap (when applied) is drawn as a redline limit.
 */
export function ScoreScale({ score, band, capLimit }: { score: number; band: ScoreBandId; capLimit?: number }) {
  const bandInfo = SCORE_BANDS.find((b) => b.id === band)!;
  return (
    <div>
      <p className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="font-display text-[3.25rem] leading-none font-[680] [font-stretch:120%]" aria-label={`Decision score ${score} out of 100`}>
          {score}
          <span className="ml-1 text-h3 text-chalk-dim">/100</span>
        </span>
        <span className="text-h3 font-display font-[600] text-pencil [font-stretch:112%]">{bandInfo.label}</span>
      </p>
      <p className="mt-2 text-small text-chalk-dim">{bandInfo.meaning}</p>

      <div className="relative mt-6 h-12" aria-hidden="true">
        {/* baseline */}
        <div className="absolute inset-x-0 top-5 h-px bg-line-strong" />
        {/* band boundaries and labels */}
        {SCORE_BANDS.map((b, i) => {
          const next = SCORE_BANDS[i + 1]?.min ?? 100;
          return (
            <div key={b.id} className="absolute top-2 h-6 border-l border-line-strong" style={{ left: `${b.min}%`, width: `${next - b.min}%` }}>
              <span className={`absolute top-7 hidden text-micro whitespace-nowrap sm:block ${i === SCORE_BANDS.length - 1 ? "right-0" : "left-1.5"} ${b.id === band ? "text-chalk" : "text-chalk-dim"}`}>{b.label}</span>
            </div>
          );
        })}
        <div className="absolute top-2 right-0 h-6 border-r border-line-strong" />
        {capLimit !== undefined ? <div className="absolute top-0 h-10 border-l-2 border-dashed border-redline" style={{ left: `${capLimit}%` }} /> : null}
        {/* the marker */}
        <div className="absolute top-[13px] size-3.5 -translate-x-1/2 rotate-45 bg-pencil" style={{ left: `${score}%` }} />
      </div>
    </div>
  );
}
