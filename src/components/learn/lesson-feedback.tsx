"use client";

import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/field";

export function LessonFeedback({ slug, version }: { slug: string; version: number }) {
  const submissionId = useRef<string | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setStatus("sending");
    setError("");
    try {
      submissionId.current ??= crypto.randomUUID();
      const res = await fetch("/api/lessons/activity", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind: "feedback", slug, version, submissionId: submissionId.current,
          helpful: data.get("helpful") === "yes", comment: data.get("comment"),
        }),
      });
      if (!res.ok) {
        const response = await res.json().catch(() => null);
        setError(response?.error?.message || "Could not send your feedback. Try again.");
        setStatus("idle");
        return;
      }
      setStatus("sent");
    } catch {
      setStatus("idle");
      setError("Could not reach VibeAcademy. Try again.");
    }
  }

  return (
    <section aria-labelledby="feedback-title" className="mt-8 border-t border-line pt-6">
      <h2 id="feedback-title" className="text-h3">Did this help you decide?</h2>
      {status === "sent" ? <p role="status" className="mt-3 text-pencil">Thanks for your feedback.</p> : (
        <form onSubmit={submit} className="mt-4 max-w-prose">
          <fieldset disabled={status === "sending"} className="space-y-4">
            <legend className="sr-only">Did this help you decide?</legend>
            <div className="flex flex-wrap gap-x-6">
              <label className="flex items-center gap-2 py-2"><input type="radio" name="helpful" value="yes" required className="accent-pencil" />Yes</label>
              <label className="flex items-center gap-2 py-2"><input type="radio" name="helpful" value="no" required className="accent-pencil" />Not yet</label>
            </div>
            <div>
              <Label htmlFor="lesson-comment" hint="optional">What would make this lesson more useful?</Label>
              <Textarea id="lesson-comment" name="comment" maxLength={500} rows={3} aria-describedby="comment-hint" />
              <p id="comment-hint" className="mt-1 text-small text-chalk-dim">Private to the VibeAcademy team. Up to 500 characters. Leave out personal details.</p>
            </div>
            <Button type="submit" variant="secondary">{status === "sending" ? "Sending…" : "Send feedback"}</Button>
          </fieldset>
          {error && <p role="alert" className="mt-3 text-redline">{error}</p>}
        </form>
      )}
    </section>
  );
}
