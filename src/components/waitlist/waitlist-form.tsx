"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox, Input, Label, Select } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";

const TOOLS = [
  ["lovable", "Lovable"],
  ["bolt", "Bolt"],
  ["replit", "Replit"],
  ["v0", "v0"],
  ["cursor", "Cursor"],
  ["claude-code", "Claude Code"],
  ["copilot", "GitHub Copilot"],
  ["other", "Something else"],
  ["none-yet", "None yet"],
] as const;

const EXPERIENCE = [
  ["no-code", "I don't write code"],
  ["reads-code", "I can read some code"],
  ["writes-code", "I write code"],
  ["professional", "I'm a professional developer"],
] as const;

export function WaitlistForm({ source }: { source?: string }) {
  const [status, setStatus] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setStatus("busy");
    setError(null);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          tool: form.get("tool") || undefined,
          experience: form.get("experience") || undefined,
          source: source && /^[a-z0-9-]{1,40}$/.test(source) ? source : undefined,
          consent: form.get("consent") === "on",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error?.message ?? "That did not work. Try again.");
      }
      setStatus("done");
    } catch (err) {
      setStatus("idle");
      setError(err instanceof Error ? err.message : "That did not work. Try again.");
    }
  }

  if (status === "done") {
    return (
      <Notice tone="success" title="You're on the list">
        We will email you once, when VibeAcademy opens. Nothing else.
      </Notice>
    );
  }

  return (
    <form onSubmit={submit} className="grid max-w-xl gap-5" noValidate>
      <div>
        <Label htmlFor="wl-email">Email</Label>
        <Input id="wl-email" name="email" type="email" autoComplete="email" required maxLength={254} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2 sm:items-end">
        <div>
          <Label htmlFor="wl-tool" hint="optional">Which AI tool do you build with?</Label>
          <Select id="wl-tool" name="tool" defaultValue="">
            <option value="">Choose one</option>
            {TOOLS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="wl-exp" hint="optional">How technical are you?</Label>
          <Select id="wl-exp" name="experience" defaultValue="">
            <option value="">Choose one</option>
            {EXPERIENCE.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
        </div>
      </div>
      <Checkbox id="wl-consent" name="consent" required>
        Email me when VibeAcademy opens. I can ask for my email to be deleted at any time.
      </Checkbox>
      <div>
        <Button type="submit" disabled={status === "busy"}>
          {status === "busy" ? "Joining…" : "Join the waitlist"}
        </Button>
      </div>
      {error ? <Notice tone="error">{error}</Notice> : null}
    </form>
  );
}
