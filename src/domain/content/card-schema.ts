import { z } from "zod";
import { CHAPTER_IDS, DECISION_IDS, DOMAIN_IDS, RANK_IDS } from "../taxonomy";

/**
 * Decision Card schema. Every card has the same eight parts (product-defining):
 *  1 question  2 moment  3 ifSilent  4 options (with trade-offs)  5 cost and effort (per option)
 *  6 promptLine (per option)  7 proveIt  8 goDeeper (five depths + related cards)
 *
 * Versioning: bump `version` whenever facts, options or prompt lines change (not for typo
 * fixes). Blueprints record the card version a decision was made with.
 */

const nonEmpty = z.string().trim().min(1);
const prose = z.string().trim().min(20, "Write at least a full sentence.");

export const CardOptionSchema = z.strictObject({
  key: z.string().regex(/^[a-z0-9-]+$/, "Option keys are kebab-case."),
  label: nonEmpty,
  summary: prose,
  pros: z.array(nonEmpty).min(1),
  cons: z.array(nonEmpty).min(1),
  cost: nonEmpty,
  effort: nonEmpty,
  promptLine: prose,
  recommended: z.boolean().default(false),
});

export const CardSchema = z
  .strictObject({
    slug: z.string().regex(/^[a-z0-9-]+$/),
    version: z.number().int().positive(),
    updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD."),
    status: z.enum(["draft", "reviewed"]),
    title: nonEmpty,
    domain: z.enum(DOMAIN_IDS),
    chapter: z.enum(CHAPTER_IDS),
    minRank: z.enum(RANK_IDS),
    decisionIds: z.array(z.enum(DECISION_IDS as [string, ...string[]])).min(1),
    // 1-3: the question, the moment it matters, what happens if you stay silent
    question: nonEmpty,
    moment: prose,
    ifSilent: prose,
    // 4-6: options with trade-offs, cost and effort, and the prompt line that encodes each
    options: z.array(CardOptionSchema).min(2).max(4),
    // 7: a check the learner can run on their own app
    proveIt: z.strictObject({
      steps: z.array(nonEmpty).min(1),
      passWhen: prose,
    }),
    // 8: go deeper
    depths: z.strictObject({
      story: prose,
      practical: prose,
      technical: prose,
      engineer: prose,
      senior: prose,
    }),
    related: z.array(z.string().regex(/^[a-z0-9-]+$/)).default([]),
    sources: z.array(z.strictObject({ title: nonEmpty, url: z.url() })).default([]),
  })
  .superRefine((card, ctx) => {
    const keys = card.options.map((o) => o.key);
    if (new Set(keys).size !== keys.length) {
      ctx.addIssue({ code: "custom", message: "Option keys must be unique.", path: ["options"] });
    }
    if (card.options.filter((o) => o.recommended).length > 1) {
      ctx.addIssue({ code: "custom", message: "At most one option can be recommended.", path: ["options"] });
    }
  });

export type Card = z.infer<typeof CardSchema>;
export type CardOption = z.infer<typeof CardOptionSchema>;
