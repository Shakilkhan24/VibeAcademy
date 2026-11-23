import { DOMAINS, getDecision, type DomainId } from "../taxonomy";
import type { ScoreResult } from "./scoring";

/**
 * The upgraded prompt is deterministic: the learner's own prompt, followed by the prompt line
 * of every applicable decision they did not fully make, grouped by domain. Each line maps to
 * one decision (and its Decision Card when one exists), so every addition is explainable.
 *
 * No AI is involved: it costs nothing, it never invents requirements, and it never rewrites
 * the learner's words.
 */
export const UPGRADE_VERSION = 2;

export interface UpgradeLine {
  decisionId: string;
  domain: DomainId;
  status: "missing" | "partial";
  text: string;
  cardSlug?: string;
}

export interface PromptUpgrade {
  version: number;
  lines: UpgradeLine[];
  /** Full text ready to paste into an AI tool. */
  text: string;
}

export const UPGRADE_HEADER =
  "Decisions for this build (added by a VibeAcademy X-Ray; replace anything in [brackets] with your choice):";

export function buildUpgradeLines(score: ScoreResult): UpgradeLine[] {
  const lines: UpgradeLine[] = [];
  for (const domain of DOMAINS) {
    for (const a of score.assessments) {
      if (!a.applicable || a.status === "addressed") continue;
      const decision = getDecision(a.decisionId);
      if (!decision || decision.domain !== domain.id) continue;
      lines.push({
        decisionId: decision.id,
        domain: decision.domain,
        status: a.status,
        text: decision.promptLine,
        cardSlug: decision.cardSlug,
      });
    }
  }
  return lines;
}

export function renderUpgradeText(originalPrompt: string, lines: UpgradeLine[]): string {
  const base = originalPrompt.trim();
  if (lines.length === 0) return base;
  const sections: string[] = [];
  for (const domain of DOMAINS) {
    const inDomain = lines.filter((l) => l.domain === domain.id);
    if (inDomain.length === 0) continue;
    sections.push([`${domain.name}:`, ...inDomain.map((l) => `- ${l.text}`)].join("\n"));
  }
  return `${base}\n\n${UPGRADE_HEADER}\n\n${sections.join("\n\n")}`;
}

export function upgradePrompt(originalPrompt: string, score: ScoreResult): PromptUpgrade {
  const lines = buildUpgradeLines(score);
  return { version: UPGRADE_VERSION, lines, text: renderUpgradeText(originalPrompt, lines) };
}
