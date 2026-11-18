"use client";

import { useId, useSyncExternalStore } from "react";
import { DEPTHS, type DepthId } from "@/domain/taxonomy";
import { renderInline } from "@/components/ui/prose";
import { cn } from "@/lib/cn";

const STORAGE_KEY = "seniorseat:depth";
const CHANGE_EVENT = "seniorseat:depth-change";
const DEFAULT_DEPTH: DepthId = "practical";

/**
 * The learner's preferred depth, shared by every Depth Dial on the page and remembered in
 * this browser. An in-memory fallback keeps the dial working when storage is unavailable.
 * (Phase 1 moves the preference to the learner profile.)
 */
let memoryDepth: DepthId = DEFAULT_DEPTH;

function isDepth(v: unknown): v is DepthId {
  return DEPTHS.some((d) => d.id === v);
}

function readDepth(): DepthId {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (isDepth(saved)) return saved;
  } catch {
    /* storage unavailable */
  }
  return memoryDepth;
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function chooseDepth(id: DepthId) {
  memoryDepth = id;
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* storage unavailable: memoryDepth still applies */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** The Depth Dial: one explanation at five depths. */
export function DepthDial({ depths }: { depths: Record<DepthId, string> }) {
  const depth = useSyncExternalStore(subscribe, readDepth, () => DEFAULT_DEPTH);
  const groupId = useId();
  const current = DEPTHS.find((d) => d.id === depth)!;

  return (
    <div>
      <div role="radiogroup" aria-labelledby={`${groupId}-label`} className="flex flex-wrap border border-line-strong">
        <span id={`${groupId}-label`} className="sr-only">Explanation depth</span>
        {DEPTHS.map((d, i) => {
          const active = d.id === depth;
          return (
            <button
              key={d.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => chooseDepth(d.id)}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                  e.preventDefault();
                  const next = DEPTHS[(i + (e.key === "ArrowRight" ? 1 : DEPTHS.length - 1)) % DEPTHS.length]!;
                  chooseDepth(next.id);
                  (e.currentTarget.parentElement?.querySelectorAll("button")[DEPTHS.indexOf(next)] as HTMLButtonElement | undefined)?.focus();
                }
              }}
              tabIndex={active ? 0 : -1}
              className={cn(
                "flex-1 border-r border-line-strong px-3 py-2.5 text-left text-small last:border-r-0",
                active ? "bg-pencil text-pencil-ink" : "text-chalk-dim hover:bg-paper-raised hover:text-chalk",
              )}
            >
              <span className="block text-micro opacity-80">{d.level}</span>
              <span className="font-medium">{d.name}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-micro text-chalk-dim">{current.voice}</p>
      <div aria-live="polite" className="prose-sheet mt-4 text-measure text-body">
        <p>{renderInline(depths[depth])}</p>
      </div>
    </div>
  );
}
