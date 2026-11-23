import { notFound } from "next/navigation";
import { loadTutorials } from "@/content/tutorials";
import { DEPTHS, getChapter } from "@/domain/taxonomy";
import { learningImage } from "../_share-image";

export const alt = "A VibeAcademy tutorial";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lesson = (await loadTutorials()).find((item) => item.slug === slug);
  if (!lesson) notFound();
  const depth = DEPTHS.find((item) => item.id === lesson.level)!;
  return learningImage(lesson.title, [getChapter(lesson.chapter).name, depth.name, lesson.status === "draft" ? "Draft" : "Reviewed"].join(" · "));
}
