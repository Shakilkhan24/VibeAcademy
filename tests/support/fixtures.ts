import { DECISION_IDS, NO_TRAITS, type AppTraits } from "@/domain/taxonomy";
import type { Classification, DecisionStatus } from "@/domain/xray/classification";

export const ALL_TRAITS: AppTraits = {
  hasAccounts: true,
  storesPersonalData: true,
  takesPayments: true,
  hasServerData: true,
  isPublic: true,
  callsAiModels: true,
  acceptsUploads: true,
};

export function classification(opts: {
  traits?: Partial<AppTraits>;
  all?: DecisionStatus;
  statuses?: Record<string, DecisionStatus>;
} = {}): Classification {
  const statuses: Record<string, DecisionStatus> = {};
  for (const id of DECISION_IDS) statuses[id] = opts.all ?? "missing";
  Object.assign(statuses, opts.statuses ?? {});
  return {
    isSoftwareRequest: true,
    language: "en",
    appType: "online-shop",
    traits: { ...NO_TRAITS, ...(opts.traits ?? {}) },
    statuses,
  };
}

/** A realistic beginner prompt used across tests and smoke checks. */
export const SHOP_PROMPT =
  "Build me an online shop for my homemade candles. Customers can sign up, browse products, add to cart and pay with Stripe. I want an admin page to add products and see orders.";
