import type { MetadataRoute } from "next";
import { loadCards, loadEpisodes } from "@/content";

const site = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [cards, episodes] = await Promise.all([loadCards(), loadEpisodes()]);
  const pages = ["", "/xray", "/cards", "/lab", "/open", "/waitlist", "/privacy"];
  return [
    ...pages.map((p) => ({ url: `${site}${p}` })),
    ...cards.map((c) => ({ url: `${site}/cards/${c.slug}`, lastModified: c.updated })),
    ...episodes.map((e) => ({ url: `${site}/lab/${e.slug}` })),
  ];
}
