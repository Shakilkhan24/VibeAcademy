"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { Notice } from "@/components/ui/notice";

type Status = { kind: "idle" } | { kind: "busy" } | { kind: "error"; message: string } | { kind: "deleted" };

async function call(path: string, method: "POST" | "DELETE", body: unknown) {
  const res = await fetch(path, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message ?? "That did not work. Try again.");
  return data;
}

/**
 * Sharing is opt-in and shares the summary only (score, coverage, top risks): never the prompt.
 * Deleting removes the stored analysis for good.
 */
export function SharePanel({ runId, ownerToken, onDeleted }: { runId: string; ownerToken: string; onDeleted: () => void }) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const owner = { runId, ownerToken };

  async function run(action: () => Promise<void>) {
    setStatus({ kind: "busy" });
    try {
      await action();
      setStatus((s) => (s.kind === "deleted" ? s : { kind: "idle" }));
    } catch (error) {
      setStatus({ kind: "error", message: error instanceof Error ? error.message : "That did not work." });
    }
  }

  if (status.kind === "deleted") {
    return <Notice tone="success" title="Deleted">This X-Ray is gone from our database. Your prompt was never stored.</Notice>;
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div>
        <h3 className="text-h3">Share your score</h3>
        <p className="mt-2 text-small text-chalk-dim">
          A share link shows your score, the floor plan and your top risks. It never shows your prompt or what your app is.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {shareUrl ? (
            <>
              <input readOnly value={shareUrl} aria-label="Share link" className="min-w-0 flex-1 border border-line-strong bg-paper-deep px-3 py-2 font-mono text-micro text-chalk" onFocus={(e) => e.currentTarget.select()} />
              <CopyButton text={shareUrl} label="Copy link" />
              <Button type="button" variant="quiet" disabled={status.kind === "busy"} onClick={() => run(async () => { await call("/api/xray/share", "DELETE", owner); setShareUrl(null); })}>
                Stop sharing
              </Button>
            </>
          ) : (
            <Button type="button" variant="secondary" disabled={status.kind === "busy"} onClick={() => run(async () => { const r = await call("/api/xray/share", "POST", owner); setShareUrl(r.url); })}>
              Create share link
            </Button>
          )}
        </div>
      </div>
      <div>
        <h3 className="text-h3">Delete this result</h3>
        <p className="mt-2 text-small text-chalk-dim">
          We keep the score and coverage (never the prompt) to improve SeniorSeat. You can remove it now.
        </p>
        <div className="mt-4">
          <Button
            type="button"
            variant="secondary"
            disabled={status.kind === "busy"}
            onClick={() =>
              run(async () => {
                await call("/api/xray", "DELETE", owner);
                setStatus({ kind: "deleted" });
                onDeleted();
              })
            }
          >
            Delete this X-Ray
          </Button>
        </div>
      </div>
      {status.kind === "error" ? <Notice tone="error" className="md:col-span-2">{status.message}</Notice> : null}
    </div>
  );
}
