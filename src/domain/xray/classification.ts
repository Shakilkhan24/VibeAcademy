import { z } from "zod";
import { APP_TYPES, DECISION_IDS, NO_TRAITS, TRAIT_IDS, type AppTraits, type AppType } from "../taxonomy";

/**
 * Classification is the ONLY thing the AI contributes to an X-Ray: for each decision in the
 * taxonomy, does the prompt address it? Everything else (applicability, score, risks, the
 * upgraded prompt) is deterministic code.
 *
 * Privacy: the classification contains no free text from the prompt. It is safe to cache
 * and store. The raw prompt never leaves the request that carried it.
 */
export const DECISION_STATUSES = ["addressed", "partial", "missing"] as const;
export type DecisionStatus = (typeof DECISION_STATUSES)[number];

export interface Classification {
  /** False when the input does not describe software to build (e.g. "hello"). */
  isSoftwareRequest: boolean;
  /** ISO 639-1 code of the prompt's main language, or "und" when unknown. */
  language: string;
  appType: AppType;
  traits: AppTraits;
  /** Status for EVERY decision id in the taxonomy. */
  statuses: Record<string, DecisionStatus>;
}

/** Strict schema: what we ask the model to produce. */
export const ModelClassificationSchema = z.strictObject({
  isSoftwareRequest: z.boolean(),
  language: z.string(),
  appType: z.enum(APP_TYPES),
  traits: z.strictObject(Object.fromEntries(TRAIT_IDS.map((t) => [t, z.boolean()])) as Record<(typeof TRAIT_IDS)[number], z.ZodBoolean>),
  decisions: z.array(
    z.strictObject({
      id: z.enum(DECISION_IDS as [string, ...string[]]),
      status: z.enum(DECISION_STATUSES),
    }),
  ),
});
export type ModelClassification = z.infer<typeof ModelClassificationSchema>;

/**
 * Lenient schema: what we accept back. Models can vary enum casing or include an unknown id;
 * we normalise rather than fail, but the overall shape must hold.
 */
const LenientSchema = z.object({
  isSoftwareRequest: z.boolean(),
  language: z.string().max(16),
  appType: z.string().max(64),
  traits: z.record(z.string(), z.boolean()),
  decisions: z.array(z.object({ id: z.string().max(64), status: z.string().max(32) })).max(500),
});

export class ClassificationShapeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClassificationShapeError";
  }
}

const KNOWN_IDS = new Set(DECISION_IDS);

/** Normalise model output into a complete, typed Classification. Throws on a broken shape. */
export function normalizeClassification(raw: unknown): Classification {
  const parsed = LenientSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ClassificationShapeError(`Classification has the wrong shape: ${parsed.error.issues[0]?.message ?? "unknown"}`);
  }
  const value = parsed.data;

  const appTypeLower = value.appType.trim().toLowerCase();
  const appType = (APP_TYPES as readonly string[]).includes(appTypeLower) ? (appTypeLower as AppType) : "other";

  const traits: AppTraits = { ...NO_TRAITS };
  for (const id of TRAIT_IDS) {
    // Missing traits default to false: an undecided trait must not create obligations.
    traits[id] = value.traits[id] === true;
  }

  const statuses: Record<string, DecisionStatus> = {};
  for (const item of value.decisions) {
    const id = item.id.trim().toLowerCase();
    if (!KNOWN_IDS.has(id) || id in statuses) continue; // drop unknown ids and duplicates (first wins)
    const status = item.status.trim().toLowerCase();
    statuses[id] = (DECISION_STATUSES as readonly string[]).includes(status) ? (status as DecisionStatus) : "missing";
  }
  for (const id of DECISION_IDS) {
    if (!(id in statuses)) statuses[id] = "missing"; // silence is the default
  }

  const language = /^[a-z]{2,3}$/i.test(value.language.trim()) ? value.language.trim().toLowerCase() : "und";

  return { isSoftwareRequest: value.isSoftwareRequest, language, appType, traits, statuses };
}
