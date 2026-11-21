import { DOMAINS, type DomainId } from "./domains";
import { DECISIONS, type Decision } from "./decisions";
import type { AppTraits } from "./traits";

export * from "./domains";
export * from "./decisions";
export * from "./learning";
export * from "./traits";

/**
 * Bump when decisions, their ids, weights, applicability or classifier guidance change.
 * Stored on every X-Ray run and part of the AI cache key, so old results stay explainable.
 */
export const TAXONOMY_VERSION = 2;

export const DECISION_IDS = DECISIONS.map((d) => d.id);

const decisionById = new Map(DECISIONS.map((d) => [d.id, d]));

export function getDecision(id: string): Decision | undefined {
  return decisionById.get(id);
}

export function decisionsInDomain(domain: DomainId): Decision[] {
  return DECISIONS.filter((d) => d.domain === domain);
}

/** Deterministic: does this decision matter for an app with these traits? */
export function appliesTo(decision: Decision, traits: AppTraits): boolean {
  const rule = decision.appliesWhen;
  if (!rule) return true;
  const allOk = (rule.all ?? []).every((t) => traits[t]);
  const anyOk = !rule.any || rule.any.length === 0 || rule.any.some((t) => traits[t]);
  return allOk && anyOk;
}

export function domainOrder(domain: DomainId): number {
  return DOMAINS.findIndex((d) => d.id === domain);
}
