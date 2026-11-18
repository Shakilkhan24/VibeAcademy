import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Renders authored card prose safely: paragraphs split on blank lines, `inline code` in
 * backticks. No HTML is ever injected, so content cannot carry script.
 */
export function renderInline(text: string): ReactNode[] {
  return text.split(/(`[^`]+`)/g).map((part, i) =>
    part.startsWith("`") && part.endsWith("`") && part.length > 2 ? <code key={i}>{part.slice(1, -1)}</code> : part,
  );
}

export function Prose({ text, className }: { text: string; className?: string }) {
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  return (
    <div className={cn("prose-sheet text-measure", className)}>
      {paragraphs.map((p, i) => (
        <p key={i}>{renderInline(p)}</p>
      ))}
    </div>
  );
}
