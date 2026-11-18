import { DECISIONS, DOMAINS, appliesTo, getDecision, type DomainId } from "../taxonomy";
import type { Classification, DecisionStatus } from "./classification";

/**
 * Deterministic X-Ray scoring. Same classification in, same score out, forever (per version).
 *
 *   score = round(100 × Σ(weight × value) / Σ(weight))   over APPLICABLE decisions only
 *   value: addressed = 1, partial = 0.5, missing = 0
 *   If any applicable CRITICAL decision is missing, the score is capped at CRITICAL_CAP.
 *
 * Bump SCORING_VERSION for any change to these rules. It is stored with every run.
 */
export const SCORING_VERSION = 1;
export const CRITICAL_CAP = 60;
export const TOP_RISK_COUNT = 3;

export const STATUS_VALUE: Record<DecisionStatus, number> = { addressed: 1, partial: 0.5, missing: 0 };

export const SCORE_BANDS = [
  { id: "mostly-silent", min: 0, label: "Mostly silent", meaning: "The AI will make most of the important calls for you." },
  { id: "partly-decided", min: 40, label: "Partly decided", meaning: "Some key decisions are made; several big ones are still left to the AI." },
  { id: "well-specified", min: 70, label: "Well specified", meaning: "Most decisions are made; a few gaps remain." },
  { id: "senior-ready", min: 90, label: "Senior-ready", meaning: "This reads like a senior engineer's brief." },
] as const;
export type ScoreBandId = (typeof SCORE_BANDS)[number]["id"];

export interface DecisionAssessment {
  decisionId: string;
  applicable: boolean;
  status: DecisionStatus;
  weight: number;
  /** Points earned toward the score (weight × value), 0 when not applicable. */
  earned: number;
}

export interface DomainCoverage {
  domain: DomainId;
  applicable: number;
  addressed: number;
  partial: number;
  missing: number;
  /** Weighted coverage 0..1, or null when no decision in this domain applies. */
  ratio: number | null;
}

export interface ScoreResult {
  version: number;
  score: number;
  /** Score before any cap. */
  uncappedScore: number;
  band: ScoreBandId;
  cap: { applied: boolean; limit: number; criticalMissing: string[] };
  applicableCount: number;
  addressedCount: number;
  partialCount: number;
  /** Applicable decisions the prompt left entirely to the AI. */
  silentCount: number;
  domains: DomainCoverage[];
  assessments: DecisionAssessment[];
  /** Highest-priority unresolved decisions, most important first. */
  topRisks: string[];
}

export function bandFor(score: number): ScoreBandId {
  let band: ScoreBandId = "mostly-silent";
  for (const b of SCORE_BANDS) if (score >= b.min) band = b.id;
  return band;
}

export function scoreClassification(classification: Classification): ScoreResult {
  const assessments: DecisionAssessment[] = DECISIONS.map((decision) => {
    const applicable = appliesTo(decision, classification.traits);
    const status = classification.statuses[decision.id] ?? "missing";
    return {
      decisionId: decision.id,
      applicable,
      status,
      weight: decision.weight,
      earned: applicable ? decision.weight * STATUS_VALUE[status] : 0,
    };
  });

  const applicable = assessments.filter((a) => a.applicable);
  const possible = applicable.reduce((sum, a) => sum + a.weight, 0);
  const earned = applicable.reduce((sum, a) => sum + a.earned, 0);
  const uncappedScore = possible === 0 ? 0 : Math.round((100 * earned) / possible);

  const criticalMissing = applicable
    .filter((a) => a.status === "missing" && getDecision(a.decisionId)?.critical)
    .map((a) => a.decisionId);
  const capApplied = criticalMissing.length > 0 && uncappedScore > CRITICAL_CAP;
  const score = criticalMissing.length > 0 ? Math.min(uncappedScore, CRITICAL_CAP) : uncappedScore;

  const domains: DomainCoverage[] = DOMAINS.map((domain) => {
    const inDomain = applicable.filter((a) => getDecision(a.decisionId)?.domain === domain.id);
    const weightSum = inDomain.reduce((s, a) => s + a.weight, 0);
    return {
      domain: domain.id,
      applicable: inDomain.length,
      addressed: inDomain.filter((a) => a.status === "addressed").length,
      partial: inDomain.filter((a) => a.status === "partial").length,
      missing: inDomain.filter((a) => a.status === "missing").length,
      ratio: weightSum === 0 ? null : inDomain.reduce((s, a) => s + a.earned, 0) / weightSum,
    };
  });

  const order = new Map(DECISIONS.map((d, i) => [d.id, i]));
  const topRisks = applicable
    .filter((a) => a.status !== "addressed")
    .sort((a, b) => {
      const da = getDecision(a.decisionId)!;
      const db = getDecision(b.decisionId)!;
      if (da.critical !== db.critical) return da.critical ? -1 : 1;
      if (a.status !== b.status) return a.status === "missing" ? -1 : 1;
      if (da.weight !== db.weight) return db.weight - da.weight;
      return (order.get(a.decisionId) ?? 0) - (order.get(b.decisionId) ?? 0);
    })
    .slice(0, TOP_RISK_COUNT)
    .map((a) => a.decisionId);

  return {
    version: SCORING_VERSION,
    score,
    uncappedScore,
    band: bandFor(score),
    cap: { applied: capApplied, limit: CRITICAL_CAP, criticalMissing },
    applicableCount: applicable.length,
    addressedCount: applicable.filter((a) => a.status === "addressed").length,
    partialCount: applicable.filter((a) => a.status === "partial").length,
    silentCount: applicable.filter((a) => a.status === "missing").length,
    domains,
    assessments,
    topRisks,
  };
}
