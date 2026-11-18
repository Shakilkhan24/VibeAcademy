import type { Episode, Methodology } from "@/domain/content/lab-schema";
import { Tag } from "@/components/ui/tag";

const STATUS_LABEL: Record<Episode["status"], string> = {
  planned: "Planned",
  building: "Being built",
  testing: "Being tested",
  published: "Published",
};

function format(value: number, unit: string) {
  return `${value.toLocaleString("en-US")}${unit === "%" ? "%" : ` ${unit}`}`;
}

/**
 * Twin A vs Twin B, metric by metric. Shows "Not measured yet" until an episode is published:
 * the schema forbids numbers on unpublished episodes, so nothing here can be invented.
 */
export function FightCard({ episode, methodology }: { episode: Episode; methodology: Methodology }) {
  const measured = new Map(episode.measurements.map((m) => [m.metric, m]));
  return (
    <div className="sheet overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-small">
        <caption className="px-4 pt-4 pb-2 text-left">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-display text-h3 [font-stretch:112%]">Episode {episode.number}: {episode.title}</span>
            <Tag tone={episode.status === "published" ? "pencil" : "dashed"}>{STATUS_LABEL[episode.status]}</Tag>
          </span>
        </caption>
        <thead>
          <tr className="border-y border-line text-left">
            <th scope="col" className="px-4 py-2 font-medium">Measure</th>
            <th scope="col" className="px-4 py-2 font-medium">{episode.twinA.label}</th>
            <th scope="col" className="px-4 py-2 font-medium">{episode.twinB.label}</th>
          </tr>
        </thead>
        <tbody>
          {methodology.metrics.map((metric) => {
            const m = measured.get(metric.id);
            const better = m ? (metric.betterWhen === "lower" ? (m.twinA < m.twinB ? "a" : m.twinB < m.twinA ? "b" : null) : m.twinA > m.twinB ? "a" : m.twinB > m.twinA ? "b" : null) : null;
            return (
              <tr key={metric.id} className="border-b border-line last:border-b-0">
                <th scope="row" className="px-4 py-2.5 text-left font-normal">
                  {metric.name}
                  <span className="block text-micro text-chalk-dim">{metric.betterWhen === "lower" ? "Lower is better" : "Higher is better"}</span>
                </th>
                {m ? (
                  <>
                    <td className={`px-4 py-2.5 ${better === "a" ? "text-pencil" : ""}`}>{format(m.twinA, metric.unit)}</td>
                    <td className={`px-4 py-2.5 ${better === "b" ? "text-pencil" : ""}`}>{format(m.twinB, metric.unit)}</td>
                  </>
                ) : (
                  <td colSpan={2} className="px-4 py-2.5 text-chalk-dim">Not measured yet</td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
