import type { AppTraits, AppType } from "../taxonomy";
import type { DecisionAssessment, DomainCoverage, ScoreBandId } from "./scoring";
import type { UpgradeLine } from "./prompt-upgrade";

/**
 * How an analysis was produced. "simulated" is the keyword-rule development mode and must
 * always be labelled as such in the UI. It is never presented as AI analysis.
 */
export type AnalysisMode = "ai" | "simulated";

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
