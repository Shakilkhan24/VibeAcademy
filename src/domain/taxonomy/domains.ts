/**
 * The twelve decision domains. Product-defining: do not rename or reorder without
 * a taxonomy version bump (see TAXONOMY_VERSION in ./index.ts) and an ADR.
 */
export const DOMAIN_IDS = [
  "product-scope",
  "planning-specs",
  "git-workflow",
  "front-end",
  "back-end-apis",
  "data",
  "identity-access",
  "security-secrets",
  "deployment-cloud",
  "reliability-operations",
  "scale-performance",
  "cost-business",
] as const;

export type DomainId = (typeof DOMAIN_IDS)[number];

export interface Domain {
  id: DomainId;
  /** Full name, sentence case. */
  name: string;
  /** Short label for tight layouts (coverage grid cells). */
  shortName: string;
  /** One line, plain words: what decisions in this domain are about. */
  summary: string;
}

export const DOMAINS: readonly Domain[] = [
  { id: "product-scope", name: "Product and scope", shortName: "Scope", summary: "Who it is for, what it does, and what it does not do yet." },
  { id: "planning-specs", name: "Planning and specs", shortName: "Planning", summary: "What the AI must know before it starts, and how the work is split." },
  { id: "git-workflow", name: "Git and workflow", shortName: "Git", summary: "How changes are saved, reviewed and undone." },
  { id: "front-end", name: "Front end", shortName: "Front end", summary: "What people see and touch, on which devices." },
  { id: "back-end-apis", name: "Back end and APIs", shortName: "Back end", summary: "Where the rules run and how requests are checked." },
  { id: "data", name: "Data", shortName: "Data", summary: "Where information lives and how its shape changes." },
  { id: "identity-access", name: "Identity and access", shortName: "Access", summary: "Who logs in, and who may see or change what." },
  { id: "security-secrets", name: "Security and secrets", shortName: "Security", summary: "Keys, abuse and personal data." },
  { id: "deployment-cloud", name: "Deployment and cloud", shortName: "Deploy", summary: "Where it runs and how code reaches production." },
  { id: "reliability-operations", name: "Reliability and operations", shortName: "Reliability", summary: "Backups, alerts and seeing what went wrong." },
  { id: "scale-performance", name: "Scale and performance", shortName: "Scale", summary: "Speed, files and what breaks under load." },
  { id: "cost-business", name: "Cost and business", shortName: "Cost", summary: "Bills, payments and AI spend." },
];

const byId = new Map(DOMAINS.map((d) => [d.id, d]));

export function getDomain(id: DomainId): Domain {
  const domain = byId.get(id);
  if (!domain) throw new Error(`Unknown domain: ${id}`);
  return domain;
}
