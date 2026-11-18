import { getDecision, type AppTraits, type AppType, APP_TYPE_LABELS, DECISIONS, appliesTo } from "../taxonomy";

/**
 * Build Pack generation strategy (Phase 0 ships the AGENTS.md starter; Phase 1 adds SPEC.md,
 * TASKS.md and tool adapters from the same input).
 *
 * The input is source-agnostic: an X-Ray produces "which decisions are made / open";
 * a Blueprint (Phase 1) produces concrete choices per decision. Both render through here.
 */

/** One decision recorded in a learner's Blueprint (Phase 1 persistence shape). */
export interface BlueprintDecision {
  decisionId: string;
  /** Concrete instruction the learner chose, e.g. the option's prompt line with blanks filled. */
  promptLine: string;
  cardSlug?: string;
  /** Card version at the time of the decision, so later card edits stay traceable. */
  cardVersion?: number;
  optionKey?: string;
  decidedAt: string;
}

export interface Blueprint {
  projectId: string;
  name: string;
  appType: AppType;
  traits: AppTraits;
  taxonomyVersion: number;
  decisions: BlueprintDecision[];
}

export interface BuildPackInput {
  source: "xray" | "blueprint";
  generatedAt: string;
  taxonomyVersion: number;
  appType: AppType;
  /** Decisions already made, with the concrete line when known (Blueprint) or none (X-Ray). */
  decided: { decisionId: string; promptLine?: string }[];
  /** Decisions still open, most important first. */
  open: string[];
}

export function blueprintToBuildPackInput(blueprint: Blueprint, generatedAt: string): BuildPackInput {
  const decidedIds = new Set(blueprint.decisions.map((d) => d.decisionId));
  const open = DECISIONS.filter((d) => appliesTo(d, blueprint.traits) && !decidedIds.has(d.id))
    .sort((a, b) => Number(b.critical) - Number(a.critical) || b.weight - a.weight)
    .map((d) => d.id);
  return {
    source: "blueprint",
    generatedAt,
    taxonomyVersion: blueprint.taxonomyVersion,
    appType: blueprint.appType,
    decided: blueprint.decisions.map((d) => ({ decisionId: d.decisionId, promptLine: d.promptLine })),
    open,
  };
}

export function renderAgentsMd(input: BuildPackInput): string {
  const date = input.generatedAt.slice(0, 10);
  const what = APP_TYPE_LABELS[input.appType];
  const out: string[] = [];

  out.push("# AGENTS.md");
  out.push("");
  out.push(
    input.source === "xray"
      ? `Starter generated from a SeniorSeat Prompt X-Ray on ${date} (taxonomy v${input.taxonomyVersion}). It is yours: edit it, then keep it in the root of your repository so every AI session reads it first.`
      : `Generated from your SeniorSeat Blueprint on ${date} (taxonomy v${input.taxonomyVersion}).`,
  );
  out.push("");
  out.push("## Product");
  out.push("");
  out.push(`- What we are building: [one sentence; the X-Ray read it as ${what}]`);
  out.push("- Primary user and the one job they need done: [fill in]");
  out.push("- Out of scope for version 1: [fill in]");
  out.push("");

  if (input.decided.length > 0) {
    out.push("## Decisions already made");
    out.push("");
    for (const d of input.decided) {
      const decision = getDecision(d.decisionId);
      if (!decision) continue;
      out.push(d.promptLine ? `- ${d.promptLine}` : `- ${decision.question} Decided in the original brief: restate the choice here.`);
    }
    out.push("");
  }

  const critical = DECISIONS.filter((d) => d.critical && input.open.includes(d.id));
  const openOther = input.open.filter((id) => !critical.some((c) => c.id === id));

  if (critical.length > 0) {
    out.push("## Non-negotiables");
    out.push("");
    out.push("These protect data and money. Do not ship without them.");
    out.push("");
    for (const d of critical) out.push(`- ${d.promptLine}`);
    out.push("");
  }

  if (openOther.length > 0) {
    out.push("## Open decisions: ask me before choosing");
    out.push("");
    for (const id of openOther) {
      const d = getDecision(id);
      if (!d) continue;
      out.push(`- ${d.question} Suggested default: ${d.promptLine}`);
    }
    out.push("");
  }

  out.push("## How to work");
  out.push("");
  out.push("- Work in small steps. After each step, run the checks and stop for review.");
  out.push("- Commit to Git after every working step with a clear message.");
  out.push("- When something is not decided in this file, ask before choosing, and list any assumptions you made.");
  out.push("- Never put secrets in front-end code or in Git.");
  out.push("");
  return out.join("\n");
}
