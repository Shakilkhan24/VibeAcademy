import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * A margin note on the drawing. "caveat" (dashed pencil) marks results that need a qualifier,
 * such as the rule-based check label, which must appear wherever a rule-based result is shown.
 */
export function Notice({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: "info" | "caveat" | "error" | "success";
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const tones = {
    info: "border-line-strong",
    caveat: "border-pencil/70 border-dashed",
    error: "border-redline",
    success: "border-pencil",
  } as const;
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("border-l-2 bg-paper-deep/80 px-4 py-3 text-small", tones[tone], className)}>
      {title ? <p className="font-medium text-chalk">{title}</p> : null}
      {children ? <div className={cn("text-chalk-dim", title && "mt-1")}>{children}</div> : null}
    </div>
  );
}
