import type { AppTraits, AppType } from "../taxonomy";
import type { DecisionAssessment, DomainCoverage, ScoreBandId } from "./scoring";
import type { UpgradeLine } from "./prompt-upgrade";

/**
 * How an analysis was produced. "rules" is the rule-based check (keyword rules), the default
 * engine; it is always labelled as a rule-based check in the UI and never presented as AI.
 */
export type AnalysisMode = "ai" | "rules";

/** Everything that may appear on a public share page. Contains nothing from the prompt. */
export interface XRaySharedSummary {
  score: number;
  band: ScoreBandId;
  silentCount: number;
  partialCount: number;
  addressedCount: number;
  applicableCount: number;
  capApplied: boolean;
  criticalMissing: string[];
  domains: DomainCoverage[];
  topRisks: string[];
  mode: AnalysisMode;
  taxonomyVersion: number;
  scoringVersion: number;
  createdAt: string;
}

/** Response to the person who ran the X-Ray. Still never echoes the prompt back. */
export interface XRayOwnerResult extends XRaySharedSummary {
  runId: string;
  /** Proves ownership for sharing and deletion. Shown once; only its hash is stored. */
  ownerToken: string;
  uncappedScore: number;
  assessments: DecisionAssessment[];
  upgradeLines: UpgradeLine[];
  isSoftwareRequest: boolean;
  appType: AppType;
  traits: AppTraits;
  language: string;
  model: string | null;
  cached: boolean;
}
