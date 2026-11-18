"use client";

import Link from "next/link";
import { useMemo } from "react";
import { getDecision } from "@/domain/taxonomy";
import { renderUpgradeText, type UpgradeLine } from "@/domain/xray/prompt-upgrade";
import { renderAgentsMd } from "@/domain/blueprint/build-pack";
import type { XRayOwnerResult } from "@/domain/xray/result";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";

/**
 * The upgraded prompt is assembled in the browser from the learner's own prompt (which never
 * leaves this tab after analysis) and the decision lines returned by the server.
 */
export function UpgradedPrompt({ prompt, result }: { prompt: string; result: XRayOwnerResult }) {
  const text = useMemo(() => renderUpgradeText(prompt, result.upgradeLines).trim(), [prompt, result.upgradeLines]);

  function downloadAgentsMd() {
    const applicable = result.assessments.filter((a) => a.applicable);
    const open = [
      ...result.topRisks,
      ...applicable
        .filter((a) => a.status !== "addressed" && !result.topRisks.includes(a.decisionId))
        .sort((a, b) => b.weight - a.weight)
        .map((a) => a.decisionId),
    ];
    const md = renderAgentsMd({
      source: "xray",
      generatedAt: new Date().toISOString(),
      taxonomyVersion: result.taxonomyVersion,
      appType: result.appType,
      decided: applicable.filter((a) => a.status === "addressed").map((a) => ({ decisionId: a.decisionId })),
      open,
    });
    const url = URL.createObjectURL(new Blob([md], { type: "text/markdown" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "AGENTS.md";
    a.click();
    URL.revokeObjectURL(url);
  }

  const missing = result.upgradeLines.filter((l) => l.status === "missing").length;
  const partial = result.upgradeLines.length - missing;
  // One entry per Decision Card, in the order the lines appear (domain order).
  const cards = [...new Map(
    result.upgradeLines
      .filter((l: UpgradeLine) => l.cardSlug)
      .map((l) => [l.cardSlug!, { slug: l.cardSlug!, question: getDecision(l.decisionId)!.question }] as const),
  ).values()];

  if (result.upgradeLines.length === 0) {
    return <p className="text-chalk-dim">Nothing to add: your prompt already makes every relevant decision.</p>;
  }

  return (
    <div>
      <div className="sheet">
        <pre className="max-h-[420px] overflow-auto p-5 font-mono text-small leading-relaxed whitespace-pre-wrap text-chalk">{text}</pre>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <CopyButton text={text} label="Copy upgraded prompt" variant="primary" />
        <Button type="button" variant="secondary" onClick={downloadAgentsMd}>
          Download AGENTS.md starter
        </Button>
      </div>
      <p className="mt-3 text-small text-chalk-dim text-measure">
        Replace anything in [brackets] with your own choice. The AGENTS.md starter is a file your AI tool reads at the start of every session, so these decisions stop being re-decided.
      </p>

      <h3 className="mt-10 text-h3">What was added</h3>
      <p className="mt-2 text-small text-chalk-dim text-measure">
        {missing} {missing === 1 ? "line covers a decision" : "lines cover decisions"} your prompt did not mention
        {partial > 0 ? `, and ${partial} ${partial === 1 ? "line settles a decision" : "lines settle decisions"} it only touched` : ""}. The full list
        is under all decisions below.
      </p>
      {cards.length > 0 ? (
        <>
          <p className="mt-5 text-small font-medium">Learn these first</p>
          <ul className="mt-2 divide-y divide-line border-y border-line">
            {cards.map(({ slug, question }) => (
              <li key={slug} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3 text-small">
                <span>{question}</span>
                <Link href={`/cards/${slug}`} className="text-pencil underline">See the options</Link>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
