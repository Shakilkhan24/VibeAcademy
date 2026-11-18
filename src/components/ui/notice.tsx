import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * A margin note on the drawing. "simulated" is the development-mode label and must appear
 * wherever simulated analysis is shown.
 */
export function Notice({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: "info" | "simulated" | "error" | "success";
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const tones = {
    info: "border-line-strong",
    simulated: "border-pencil/70 border-dashed",
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
