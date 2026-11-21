import type { MetadataRoute } from "next";
import { loadCards, loadEpisodes } from "@/content";
import { loadTutorials } from "@/content/tutorials";

const site = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [cards, episodes, tutorials] = await Promise.all([loadCards(), loadEpisodes(), loadTutorials()]);
  const pages = ["", "/learn", "/xray", "/cards", "/lab", "/open", "/waitlist", "/privacy"];
  return [
    ...pages.map((p) => ({ url: `${site}${p}` })),
    ...tutorials.map((t) => ({ url: `${site}/learn/${t.slug}`, lastModified: t.updatedAt })),
    ...cards.map((c) => ({ url: `${site}/cards/${c.slug}`, lastModified: c.updated })),
    ...episodes.map((e) => ({ url: `${site}/lab/${e.slug}` })),
  ];
}
