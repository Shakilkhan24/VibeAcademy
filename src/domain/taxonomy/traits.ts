/**
 * App traits decide which decisions apply to a given idea. A landing page does not need
 * login decisions; a shop that takes money does need payment decisions.
 *
 * Traits are classified from the prompt (by AI in production). Applicability itself is
 * deterministic: see `appliesTo` in ./index.ts.
 */
export const TRAIT_IDS = [
  "hasAccounts",
  "storesPersonalData",
  "takesPayments",
  "hasServerData",
  "isPublic",
  "callsAiModels",
  "acceptsUploads",
] as const;

export type TraitId = (typeof TRAIT_IDS)[number];
export type AppTraits = Record<TraitId, boolean>;

export const TRAITS: readonly { id: TraitId; label: string; meaning: string }[] = [
  { id: "hasAccounts", label: "User accounts", meaning: "People sign in." },
  { id: "storesPersonalData", label: "Personal data", meaning: "It stores names, contacts, messages or other personal information." },
  { id: "takesPayments", label: "Payments", meaning: "It takes money." },
  { id: "hasServerData", label: "Saved data", meaning: "It saves information on a server, not only in the page." },
  { id: "isPublic", label: "Public", meaning: "People other than the builder will use it." },
  { id: "callsAiModels", label: "Uses AI", meaning: "The product itself calls an AI model." },
  { id: "acceptsUploads", label: "Uploads", meaning: "People upload files or images." },
];

export const APP_TYPES = [
  "online-shop",
  "booking",
  "marketplace",
  "community",
  "saas-dashboard",
  "content-site",
  "internal-tool",
  "mobile-app",
  "ai-app",
  "game",
  "portfolio",
  "other",
  "unclear",
] as const;
export type AppType = (typeof APP_TYPES)[number];

export const APP_TYPE_LABELS: Record<AppType, string> = {
  "online-shop": "an online shop",
  booking: "a booking app",
  marketplace: "a marketplace",
  community: "a community or social app",
  "saas-dashboard": "a software-as-a-service dashboard",
  "content-site": "a content site or blog",
  "internal-tool": "an internal tool",
  "mobile-app": "a mobile app",
  "ai-app": "an AI-powered app",
  game: "a game",
  portfolio: "a portfolio or landing page",
  other: "an app",
  unclear: "something that is not clearly an app",
};

export const NO_TRAITS: AppTraits = {
  hasAccounts: false,
  storesPersonalData: false,
  takesPayments: false,
  hasServerData: false,
  isPublic: false,
  callsAiModels: false,
  acceptsUploads: false,
};
