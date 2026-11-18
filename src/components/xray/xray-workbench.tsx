"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { APP_TYPE_LABELS, DECISIONS, getDecision } from "@/domain/taxonomy";
import type { XRayOwnerResult } from "@/domain/xray/result";
import { Button, ButtonLink } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { DRAFT_KEY, LAST_RESULT_KEY, readSession, writeSession } from "./client-storage";
import { DecisionList } from "./decision-list";
import { FloorPlan } from "./floor-plan";
import { RiskList } from "./risk-list";
import { ScoreScale } from "./score-scale";
import { SharePanel } from "./share-panel";
import { UpgradedPrompt } from "./upgraded-prompt";
import { EXAMPLE_PROMPT } from "./xray-launcher";

const MAX = 4000;

type State =
  | { kind: "idle" }
  | { kind: "running" }
  | { kind: "error"; message: string }
  | { kind: "done"; result: XRayOwnerResult; analysedPrompt: string };

const noopSubscribe = () => () => {};

/**
 * The Prompt X-Ray: write, analyse, understand, improve, share. One component owns the
 * journey so the floor plan can resolve in place as the result arrives.
 *
 * The server renders the idle workbench. After hydration it remounts once with access to
 * sessionStorage, so it can pick up a prompt handed over from the home page, or restore the
 * last result after a refresh, without a hydration mismatch.
 */
export function XRayWorkbench() {
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  return <Workbench key={hydrated ? "client" : "server"} hydrated={hydrated} />;
}

function readInitial(hydrated: boolean): { draft: string | null; last: XRayOwnerResult | null } {
  if (!hydrated) return { draft: null, last: null };
  const draft = readSession(DRAFT_KEY);
  if (draft) return { draft, last: null };
  const last = readSession(LAST_RESULT_KEY);
  if (!last) return { draft: null, last: null };
  try {
    return { draft: null, last: JSON.parse(last) as XRayOwnerResult };
  } catch {
    return { draft: null, last: null };
  }
}

function Workbench({ hydrated }: { hydrated: boolean }) {
  const [initial] = useState(() => readInitial(hydrated));
  const [prompt, setPrompt] = useState(initial.draft ?? "");
  const [state, setState] = useState<State>(() =>
    initial.draft ? { kind: "running" } : initial.last ? { kind: "done", result: initial.last, analysedPrompt: "" } : { kind: "idle" },
  );
  const resultRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  const fetchAnalysis = useCallback(async (text: string) => {
    try {
      const res = await fetch("/api/xray", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: text }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) throw new Error(data?.error?.message ?? "The analysis failed. Try again in a minute.");
      const result = data as XRayOwnerResult;
      writeSession(LAST_RESULT_KEY, JSON.stringify(result)); // the result only, never the prompt
      setState({ kind: "done", result, analysedPrompt: text });
      requestAnimationFrame(() => resultRef.current?.focus());
    } catch (error) {
      setState({ kind: "error", message: error instanceof Error ? error.message : "The analysis failed." });
    }
  }, []);

  // A prompt handed over from the home page runs once, then leaves storage.
  useEffect(() => {
    if (!initial.draft || started.current) return;
    started.current = true;
    writeSession(DRAFT_KEY, null);
    void fetchAnalysis(initial.draft);
  }, [initial.draft, fetchAnalysis]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (prompt.trim().length < 20) {
      setState({ kind: "error", message: "Write at least 20 characters so there is something to analyse." });
      return;
    }
    setState({ kind: "running" });
    void fetchAnalysis(prompt);
  }

  const result = state.kind === "done" ? state.result : null;

  return (
    <div>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start">
        <form onSubmit={submit} className="sheet p-4 sm:p-5">
          <label htmlFor="xray-prompt" className="block text-small font-medium">
            The prompt you would give an AI builder
          </label>
          <Textarea
            id="xray-prompt"
            rows={9}
            className="mt-2"
            value={prompt}
            maxLength={MAX}
            placeholder={EXAMPLE_PROMPT}
            onChange={(e) => setPrompt(e.target.value)}
            aria-describedby="xray-help"
          />
          <div className="mt-2 flex justify-between gap-4 text-micro text-chalk-dim">
            <span id="xray-help">Analysed, then discarded. Never stored or used for training.</span>
            <span className="whitespace-nowrap">
              {prompt.length.toLocaleString("en-US")} / {MAX.toLocaleString("en-US")}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
            <Button type="submit" disabled={state.kind === "running"}>
              {state.kind === "running" ? "Analysing…" : result ? "Run it again" : "Run the X-Ray"}
            </Button>
            <button type="button" className="text-small text-chalk-dim underline decoration-line-strong underline-offset-4 hover:text-chalk" onClick={() => setPrompt(EXAMPLE_PROMPT)}>
              Use an example
            </button>
          </div>
          <div aria-live="polite" className="mt-3">
            {state.kind === "running" ? <p className="text-small text-chalk-dim">Reading your prompt against {DECISIONS.length} decisions…</p> : null}
            {state.kind === "error" ? <p role="alert" className="text-small text-redline">{state.message}</p> : null}
          </div>
        </form>

        <FloorPlan
          state={state.kind === "running" ? "scanning" : result ? "resolved" : "ghost"}
          coverage={result?.domains}
          criticalMissing={result?.criticalMissing}
          caption={
            result
              ? "Each room is one decision domain. Pencil hatching shows how much of it your prompt decided."
              : "Twelve rooms, one per decision domain. They stay dashed until a prompt decides something in them."
          }
        />
      </div>

      {result ? (
        <div ref={resultRef} tabIndex={-1} className="mt-16 outline-none" aria-label="X-Ray result">
          {result.mode === "rules" ? (
            <Notice tone="caveat" title="Rule-based check" className="mb-8">
              This result comes from keyword rules that look for each decision in your prompt, not from AI. It can miss a decision you described in
              your own words, or count one you only mentioned. Read the risks below as questions to ask, not as a verdict.
            </Notice>
          ) : null}
          {!result.isSoftwareRequest ? (
            <Notice tone="info" title="This does not read like an app description" className="mb-8">
              The score below may not mean much. Describe who the app is for and what it should do, then run it again.
            </Notice>
          ) : null}

          <section aria-labelledby="score-heading" className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
            <div>
              <h2 id="score-heading" className="sr-only">Score</h2>
              <ScoreScale score={result.score} band={result.band} capLimit={result.capApplied ? 60 : undefined} />
            </div>
            <div className="text-measure">
              <p className="text-h3 font-display [font-stretch:112%]">
                You left <span className="text-pencil">{result.silentCount}</span> of {result.applicableCount} relevant decisions entirely to the AI
                {result.partialCount > 0 ? <>, and only partly made {result.partialCount} more</> : null}.
              </p>
              <p className="mt-3 text-small text-chalk-dim">
                Read as {APP_TYPE_LABELS[result.appType]}. Decisions that do not apply to that kind of app are not counted.
                {result.capApplied ? (
                  <>
                    {" "}
                    The score is capped at 60 because a critical decision is missing:{" "}
                    {result.criticalMissing.map((id) => getDecision(id)?.question).join(" ")} Without the cap it would be {result.uncappedScore}.
                  </>
                ) : null}
              </p>
              <p className="mt-3 text-micro text-chalk-dim">
                {result.mode === "ai" ? `Classified by ${result.model}${result.cached ? " (cached result)" : ""}. ` : null}
                Scored by deterministic rules v{result.scoringVersion} against taxonomy v{result.taxonomyVersion}.
              </p>
            </div>
          </section>

          <section aria-labelledby="risks-heading" className="mt-16">
            <h2 id="risks-heading" className="text-h2">The decisions that will hurt first</h2>
            <p className="mt-2 mb-6 text-chalk-dim text-measure">Ordered by impact: critical decisions first, then the most important decisions the prompt is silent on.</p>
            <RiskList ids={result.topRisks} statuses={Object.fromEntries(result.assessments.map((a) => [a.decisionId, a.status]))} />
          </section>

          <section aria-labelledby="upgrade-heading" className="mt-16">
            <h2 id="upgrade-heading" className="text-h2">Your prompt, with the decisions added</h2>
            <p className="mt-2 mb-6 text-chalk-dim text-measure">
              Your words stay first. Each added line is one decision, with a sensible default you can change.
              {state.kind === "done" && !state.analysedPrompt ? " (Your original prompt is not kept after a refresh, so only the added decisions are shown.)" : null}
            </p>
            <UpgradedPrompt prompt={state.kind === "done" ? state.analysedPrompt : ""} result={result} />
          </section>

          <section aria-labelledby="all-heading" className="mt-16">
            <h2 id="all-heading" className="text-h2">All {DECISIONS.length} decisions</h2>
            <p className="mt-2 mb-6 text-chalk-dim text-measure">What the X-Ray checked, grouped by domain.</p>
            <DecisionList assessments={result.assessments} />
          </section>

          <section aria-label="Share or delete" className="mt-16 border-t border-line pt-10">
            <SharePanel
              key={result.runId}
              runId={result.runId}
              ownerToken={result.ownerToken}
              onDeleted={() => writeSession(LAST_RESULT_KEY, null)}
            />
          </section>

          <section className="mt-16 sheet p-6 sm:p-8">
            <h2 className="text-h2">Learn to make these decisions yourself</h2>
            <p className="mt-3 max-w-[60ch] text-chalk-dim">
              SeniorSeat turns each decision into a short card at your level, then builds the spec your AI tool follows. Join the waitlist to get
              in first.
            </p>
            <div className="mt-6">
              <ButtonLink href="/waitlist?source=xray">Join the waitlist</ButtonLink>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
