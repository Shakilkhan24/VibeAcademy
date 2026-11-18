"use client";

import { useState } from "react";
import { Button } from "./button";

export function CopyButton({ text, label = "Copy", copiedLabel = "Copied", variant = "secondary" }: { text: string; label?: string; copiedLabel?: string; variant?: "primary" | "secondary" | "quiet" }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      setState("failed");
    }
    setTimeout(() => setState("idle"), 2000);
  }

  return (
    <Button type="button" variant={variant} onClick={copy} aria-live="polite">
      {state === "copied" ? copiedLabel : state === "failed" ? "Select and copy manually" : label}
    </Button>
  );
}
