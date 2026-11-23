"use client";

import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";

// One key per lesson lets different tabs finish different lessons without overwriting each other.
const prefix = "seniorseat:learn:done:";
const change = "seniorseat:lesson-change";
const unsaved = new Map<string, boolean>();

function isDone(slug: string): boolean {
  const fallback = unsaved.get(slug);
  if (fallback !== undefined) return fallback;
  try {
    return window.localStorage.getItem(prefix + slug) === "1";
  } catch {
    return false;
  }
}

function toggle(slug: string) {
  const done = !isDone(slug);
  try {
    if (done) window.localStorage.setItem(prefix + slug, "1");
    else window.localStorage.removeItem(prefix + slug);
    unsaved.delete(slug);
  } catch {
    unsaved.set(slug, done);
  }
  window.dispatchEvent(new Event(change));
  return done;
}

// Keep the submission ID scoped to a single lesson version, including across re-marks.
const completionIds = new Map<string, string>();
async function reportCompletion(slug: string, version: number) {
  const key = `vibeacademy:completion:${slug}:${version}`;
  let id = completionIds.get(key);
  if (!id) {
    id = crypto.randomUUID();
    try {
      id = window.localStorage.getItem(key) || id;
      window.localStorage.setItem(key, id);
    } catch { /* The same tab can still recognise a repeated mark. */ }
    completionIds.set(key, id);
  }
  await fetch("/api/lessons/activity", {
    method: "POST", headers: { "content-type": "application/json" }, keepalive: true,
    body: JSON.stringify({ kind: "completed", slug, version, submissionId: id }),
  });
}

function subscribe(notify: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key.startsWith(prefix)) notify();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(change, notify);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(change, notify);
  };
}

function useDone(slug: string) {
  return useSyncExternalStore(subscribe, () => isDone(slug), () => false);
}

export function LessonCompletion({ slug, version }: { slug: string; version: number }) {
  const done = useDone(slug);
  return (
    <div className="mt-8 flex flex-wrap items-center gap-4">
      <Button variant={done ? "secondary" : "primary"} onClick={() => {
        if (toggle(slug)) void reportCompletion(slug, version).catch(() => { /* Local progress works offline. */ });
      }}>
        {done ? "Mark as incomplete" : "Mark as done"}
      </Button>
      <span className="text-small text-chalk-dim" role="status">{done ? "Lesson marked complete in this browser." : "This browser saves your checklist. We count completion marks."}</span>
    </div>
  );
}

export function CompletionLabel({ slug }: { slug: string }) {
  return useDone(slug) ? <span className="text-pencil">Completed</span> : null;
}

export function ProgressSummary({ slugs }: { slugs: string[] }) {
  const count = useSyncExternalStore(subscribe, () => slugs.filter(isDone).length, () => 0);
  if (!slugs.length) return null;
  return (
    <div className="mt-5 border-t border-line pt-4">
      <label className="block text-small">
        {count} of {slugs.length} {slugs.length === 1 ? "lesson" : "lessons"} completed
        <progress className="mt-2 block h-2 w-full accent-pencil" value={count} max={slugs.length} />
      </label>
    </div>
  );
}
