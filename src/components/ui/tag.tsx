import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Small inline label. Sentence case, never all caps. */
export function Tag({ children, tone = "plain", className }: { children: ReactNode; tone?: "plain" | "pencil" | "redline" | "dashed"; className?: string }) {
  const tones = {
    plain: "border-line-strong text-chalk-dim",
    pencil: "border-pencil/70 text-pencil",
    redline: "border-redline/70 text-redline",
    dashed: "border-dashed border-chalk-dim text-chalk-dim",
  } as const;
  return <span className={cn("inline-flex items-center border px-2 py-0.5 text-micro whitespace-nowrap", tones[tone], className)}>{children}</span>;
}
