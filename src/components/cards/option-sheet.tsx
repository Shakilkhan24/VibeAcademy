import type { CardOption } from "@/domain/content/card-schema";
import { CopyButton } from "@/components/ui/copy-button";
import { Tag } from "@/components/ui/tag";
import { cn } from "@/lib/cn";

/** One option of a Decision Card, laid out as a small drawing sheet. */
export function OptionSheet({ option, letter }: { option: CardOption; letter: string }) {
  return (
    <article className={cn("sheet flex flex-col p-5", option.recommended && "border-pencil/60")}>
      <header className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-h3">
          <span className="mr-2 text-chalk-dim" aria-hidden="true">{letter}</span>
          {option.label}
        </h3>
        {option.recommended ? <Tag tone="pencil">Sensible default</Tag> : null}
      </header>
      <p className="mt-3 text-small text-chalk-dim">{option.summary}</p>

      <div className="mt-5 grid gap-4 text-small sm:grid-cols-2">
        <div>
          <p className="font-medium">Gains</p>
          <ul className="mt-1.5 space-y-1 text-chalk-dim">
            {option.pros.map((p) => <li key={p} className="pl-3 -indent-3">+ {p}</li>)}
          </ul>
        </div>
        <div>
          <p className="font-medium">Costs</p>
          <ul className="mt-1.5 space-y-1 text-chalk-dim">
            {option.cons.map((c) => <li key={c} className="pl-3 -indent-3">– {c}</li>)}
          </ul>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-2 border-t border-line pt-3 text-small">
        <div>
          <dt className="text-chalk-dim">Money</dt>
          <dd>{option.cost}</dd>
        </div>
        <div>
          <dt className="text-chalk-dim">Effort</dt>
          <dd>{option.effort}</dd>
        </div>
      </dl>

      <div className="mt-5 flex grow flex-col justify-end">
        <p className="text-small font-medium">Prompt line</p>
        <p className="mt-1.5 border border-line bg-paper-deep p-3 font-mono text-micro leading-relaxed">{option.promptLine}</p>
        <div className="mt-3">
          <CopyButton text={option.promptLine} label="Copy prompt line" />
        </div>
      </div>
    </article>
  );
}
