/**
 * Learning architecture constants: App Life Path chapters, Depth Dial levels and ranks.
 * Product-defining (see docs/product.md). Changing ids requires a content migration.
 */

export const CHAPTER_IDS = [
  "dream",
  "blueprint",
  "first-build",
  "launch",
  "first-100-users",
  "going-viral",
  "growing-up",
] as const;
export type ChapterId = (typeof CHAPTER_IDS)[number];

export const CHAPTERS: readonly { id: ChapterId; name: string; moment: string }[] = [
  { id: "dream", name: "Dream", moment: "You have an idea and want to know what to build first." },
  { id: "blueprint", name: "Blueprint", moment: "You are choosing how it will be built, before any code." },
  { id: "first-build", name: "First build", moment: "Logins, data and payments are going in." },
  { id: "launch", name: "Launch", moment: "It is about to go live on the internet." },
  { id: "first-100-users", name: "First 100 users", moment: "Real people depend on it now." },
  { id: "going-viral", name: "Going viral", moment: "Traffic arrives faster than you planned." },
  { id: "growing-up", name: "Growing up", moment: "It is a real product with a team and a bill." },
];

export const DEPTH_IDS = ["story", "practical", "technical", "engineer", "senior"] as const;
export type DepthId = (typeof DEPTH_IDS)[number];

export const DEPTHS: readonly { id: DepthId; level: number; name: string; voice: string }[] = [
  { id: "story", level: 1, name: "Story", voice: "An everyday analogy, no jargon." },
  { id: "practical", level: 2, name: "Practical", voice: "Plain words and what to tell the AI." },
  { id: "technical", level: 3, name: "Technical", voice: "The real terms, introduced gently." },
  { id: "engineer", level: 4, name: "Engineer", voice: "How it is implemented and how it fails." },
  { id: "senior", level: 5, name: "Senior", voice: "Trade-offs at scale." },
];

export const RANK_IDS = ["dreamer", "prompter", "builder", "shipper", "operator", "architect", "mentor"] as const;
export type RankId = (typeof RANK_IDS)[number];

export const RANKS: readonly { id: RankId; level: number; name: string }[] = [
  { id: "dreamer", level: 0, name: "Dreamer" },
  { id: "prompter", level: 1, name: "Prompter" },
  { id: "builder", level: 2, name: "Builder" },
  { id: "shipper", level: 3, name: "Shipper" },
  { id: "operator", level: 4, name: "Operator" },
  { id: "architect", level: 5, name: "Architect" },
  { id: "mentor", level: 6, name: "Mentor" },
];

export function getChapter(id: ChapterId) {
  const chapter = CHAPTERS.find((c) => c.id === id);
  if (!chapter) throw new Error(`Unknown chapter: ${id}`);
  return chapter;
}
