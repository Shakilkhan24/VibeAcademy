"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

/**
 * Lesson progress has two homes:
 *  - signed out: this browser's checklist (one localStorage key per lesson, so tabs that finish
 *    different lessons never overwrite each other);
 *  - signed in: the learner's saved progress on the server (/api/progress).
 *
 * On sign-in the browser checklist is imported once and then cleared, so a different learner
 * signing in on the same browser later starts from their own progress only. If the import
 * fails, the checklist stays and the import is retried on the next page.
 */
const prefix = "seniorseat:learn:done:";
const change = "seniorseat:lesson-change";
const unsaved = new Map<string, boolean>();

// ---- Browser checklist --------------------------------------------------------------

function isDoneLocally(slug: string): boolean {
  const fallback = unsaved.get(slug);
  if (fallback !== undefined) return fallback;
  try {
    return window.localStorage.getItem(prefix + slug) === "1";
  } catch {
    return false;
  }
}

function setLocal(slug: string, done: boolean) {
  try {
    if (done) window.localStorage.setItem(prefix + slug, "1");
    else window.localStorage.removeItem(prefix + slug);
    unsaved.delete(slug);
  } catch {
    unsaved.set(slug, done);
  }
}

function localSlugs(): string[] {
  const slugs = new Set([...unsaved].filter(([, done]) => done).map(([slug]) => slug));
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key?.startsWith(prefix) && window.localStorage.getItem(key) === "1") slugs.add(key.slice(prefix.length));
    }
  } catch { /* Storage unavailable: only the in-memory marks exist. */ }
  return [...slugs];
}

// ---- Saved progress (signed in) -----------------------------------------------------

interface Saved {
  userId: string;
  completed: Set<string>;
}
let saved: Saved | null = null;
let loading: { userId: string; promise: Promise<void> } | null = null;

function notify() {
  window.dispatchEvent(new Event(change));
}

async function readJson(res: Response): Promise<{ completed: string[] }> {
  if (!res.ok) throw new Error(`progress ${res.status}`);
  return (await res.json()) as { completed: string[] };
}

/** Loads the learner's saved progress, importing this browser's checklist first. */
function loadSaved(userId: string) {
  if (saved?.userId === userId || loading?.userId === userId) return;
  const promise = (async () => {
    const marks = localSlugs();
    let completed: string[];
    if (marks.length) {
      try {
        completed = (await readJson(await fetch("/api/progress/import", {
          method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slugs: marks }),
        }))).completed;
        for (const slug of marks) setLocal(slug, false); // moved to the account
      } catch {
        // Keep the checklist for a retry, and show it alongside whatever is already saved.
        const server = await fetch("/api/progress").then(readJson).catch(() => ({ completed: [] as string[] }));
        completed = [...new Set([...server.completed, ...marks])];
      }
    } else {
      completed = (await fetch("/api/progress").then(readJson).catch(() => ({ completed: [] as string[] }))).completed;
    }
    saved = { userId, completed: new Set(completed) };
    notify();
  })().finally(() => {
    loading = null;
  });
  loading = { userId, promise };
}

function useLearnerId(): string | null {
  const { data } = authClient.useSession();
  const userId = data?.user.id ?? null;
  useEffect(() => {
    if (userId) loadSaved(userId);
    else if (saved) {
      saved = null;
      notify();
    }
  }, [userId]);
  return userId;
}

function isDone(userId: string | null, slug: string): boolean {
  if (userId && saved?.userId === userId) return saved.completed.has(slug);
  return isDoneLocally(slug);
}

async function toggle(userId: string | null, slug: string): Promise<boolean> {
  const done = !isDone(userId, slug);
  if (userId && saved?.userId === userId) {
    const before = new Set(saved.completed);
    if (done) saved.completed.add(slug);
    else saved.completed.delete(slug);
    notify();
    try {
      const res = await fetch("/api/progress", {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug, done }),
      });
      saved.completed = new Set((await readJson(res)).completed);
    } catch {
      saved.completed = before; // not saved: show the true state
    }
    notify();
  } else {
    setLocal(slug, done);
    notify();
  }
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

function subscribe(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key.startsWith(prefix)) onChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(change, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(change, onChange);
  };
}

function useDone(slug: string) {
  const userId = useLearnerId();
  const done = useSyncExternalStore(subscribe, () => isDone(userId, slug), () => false);
  return { userId, done };
}

export function LessonCompletion({ slug, version }: { slug: string; version: number }) {
  const { userId, done } = useDone(slug);
  return (
    <div className="mt-8 flex flex-wrap items-center gap-4">
      <Button variant={done ? "secondary" : "primary"} onClick={async () => {
        if (await toggle(userId, slug)) void reportCompletion(slug, version).catch(() => { /* Local progress works offline. */ });
      }}>
        {done ? "Mark as incomplete" : "Mark as done"}
      </Button>
      <span className="text-small text-chalk-dim" role="status">
        {userId
          ? done ? "Lesson saved as complete to your account." : "Your account saves your checklist on every device. We count completion marks."
          : done ? "Lesson marked complete in this browser." : "This browser saves your checklist. We count completion marks."}
      </span>
    </div>
  );
}

export function CompletionLabel({ slug }: { slug: string }) {
  return useDone(slug).done ? <span className="text-pencil">Completed</span> : null;
}

export function ProgressSummary({ slugs }: { slugs: string[] }) {
  const userId = useLearnerId();
  const count = useSyncExternalStore(subscribe, () => slugs.filter((s) => isDone(userId, s)).length, () => 0);
  if (!slugs.length) return null;
  return (
    <div className="mt-5 border-t border-line pt-4">
      <label className="block text-small">
        {count} of {slugs.length} {slugs.length === 1 ? "lesson" : "lessons"} completed
        <progress className="mt-2 block h-2 w-full accent-pencil" value={count} max={slugs.length} />
      </label>
      <p className="mt-2 text-micro text-chalk-dim">{userId ? "Saved to your account." : "Saved in this browser. Sign in to keep it on every device."}</p>
    </div>
  );
}
