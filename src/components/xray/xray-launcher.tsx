"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { DRAFT_KEY, writeSession } from "./client-storage";

export const EXAMPLE_PROMPT =
  "Build me an online shop for my homemade candles. Customers can sign up, browse products, add to cart and pay with Stripe. I want an admin page to add products and see orders.";

/**
 * Home-page entry to the X-Ray. Hands the prompt to /xray through sessionStorage (never the
 * URL, which would leak it into logs and browser history).
 */
export function XRayLauncher() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (prompt.trim().length < 20) {
      setError("Write at least a sentence or two about the app you want to build.");
      return;
    }
    writeSession(DRAFT_KEY, prompt);
    router.push("/xray");
  }

  return (
    <form onSubmit={submit} className="sheet p-4 sm:p-5" aria-describedby="launcher-help">
      <label htmlFor="launcher-prompt" className="block text-small font-medium">
        The prompt you would give an AI builder
      </label>
      <Textarea
        id="launcher-prompt"
        rows={5}
        className="mt-2"
        value={prompt}
        maxLength={4000}
        placeholder={EXAMPLE_PROMPT}
        onChange={(e) => {
          setPrompt(e.target.value);
          setError(null);
        }}
      />
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
        <Button type="submit">Run the X-Ray</Button>
        <button type="button" className="text-small text-chalk-dim underline decoration-line-strong underline-offset-4 hover:text-chalk" onClick={() => setPrompt(EXAMPLE_PROMPT)}>
          Use an example
        </button>
      </div>
      <p id="launcher-help" className="mt-3 text-micro text-chalk-dim">
        Free. We analyse your prompt, then discard it: it is never stored or used for training.
      </p>
      {error ? <p role="alert" className="mt-2 text-small text-redline">{error}</p> : null}
    </form>
  );
}
