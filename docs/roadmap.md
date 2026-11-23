# Roadmap

Outcome-based milestones in dependency order. Each one opens only when the one before it meets its success check. The product plan's phases map onto them: Phase 0 = M0–M1, Phase 1 = M2–M3, Phase 2 = M4–M5, Phase 3 = M6.

Status key: **Done**, **Next**, **Planned**, **Deferred**, **Awaiting founder** (see [open-decisions.md](open-decisions.md)).

**Direction change (2026-11-18, [ADR 0011](decisions/0011-rules-first-ai-deferred.md)).** VibeAcademy is built as a tutorials-first website. Nothing in the product calls a paid AI API for now:

- The Prompt X-Ray runs on the rule-based check.
- Tutorials and Lab comparisons are written by the founder offline, with Claude Code and the founder's own instructions, and published as content files.
- The AI-assisted X-Ray and the AI mentor move to [Later](#later-ai-features-deferred).

## M0: Phase 0 foundation (Done)

- **Outcome:** a visitor can X-ray a prompt, understand the gaps, get an upgraded prompt, share a score without exposing the prompt, read Decision Cards and join the waitlist.
- **Verified by:** `pnpm verify` and `pnpm smoke` (see GENERATION_REPORT.md).

## M1: Tutorials website, ready for the first public visitors (Awaiting founder)

- **Outcome:** a visitor can follow a learning path of tutorials ordered by the seven App Life Path chapters, read each tutorial at the depth that suits them, track their own progress in the browser, use the rule-based X-Ray and join the waitlist, on a public URL in the founder's chosen design.
- **Why it matters:** tutorials are what learners come back for, and they cost nothing to serve. Phase 0 validates demand with real visitors before any paid AI or accounts.
- **Implementation status, 2026-11-22.** Steps 1–6 are implemented on `main`. The founder retained the blueprint design and approved an 80% X-Ray agreement target. The three Dream tutorials are reviewed. The founder approved including all five Decision Cards as drafts. The founder chose GitHub delivery for this pass. The app reports server failures and CI exercises the production migrations on PostgreSQL 17. Public hosting, production Postgres, live monitoring and checks against a public URL are pending. See the [verification record](status.md).
- **Scope, in order:**
  1. **Design pass.** Apply [design-brief.md](design-brief.md) to the tokens in `src/app/globals.css`, the UI primitives and the existing pages. Update [design-system.md](design-system.md). If the brief replaces the blueprint look, supersede [ADR 0009](decisions/0009-design-language.md) with a new ADR. Check every page in a browser on desktop and mobile.
  2. **Tutorial content type.** Tutorials live in `content/tutorials/` as Markdown or MDX with frontmatter validated by Zod in `src/domain/content/`. Suggested fields:
     - `title`, `slug`, `summary`, `status` (draft or reviewed) and `version`;
     - `chapter` (one of the 7), `domains` (from the 12), `level` (which of the 5 depths it targets);
     - `prerequisites`, `estimatedMinutes`, `relatedCards` and `updatedAt`.

     Record Markdown versus MDX in a new ADR that extends [ADR 0008](decisions/0008-content-as-yaml.md). Extend `pnpm content:check` and the content tests. Rendering must be safe: no raw HTML from content files.
  3. **Learning path pages.**
     - `/learn` lists tutorials grouped by chapter, with level and time.
     - `/learn/[slug]` is the tutorial page: table of contents, code blocks with copy, callouts, "Decisions this tutorial covers" linking to Decision Cards, and previous and next.
     - The sitemap and Open Graph images cover the new pages.
     - The home page points to the path.
  4. **Progress without accounts.** "Mark as done" per tutorial, stored in the browser with the same hydration-safe pattern as the Depth Dial (`useSyncExternalStore`). Progress shows on `/learn`. Server-side progress waits for accounts (M2).
  5. **Authoring workflow for the founder.**
     - A tutorial template in `content/tutorials/_template.md`.
     - A section in [content-guide.md](content-guide.md) on writing tutorials with Claude Code: the depth voices, how to cite sources and how to review.
     - The [`/draft-tutorial` command](../.claude/commands/draft-tutorial.md) starts a draft from the template using the founder's brief.
  6. **Rule-based X-Ray quality (no API calls).** Write 20–30 hand-labelled prompts in `tests/fixtures/prompts/` with the expected status of each critical decision. Add a test that measures agreement, and improve the patterns in `src/server/ai/providers/rules.ts` until the approved 80% agreement target is met. Bump `TAXONOMY_VERSION` when the criteria change.
  7. **Deploy.** Set up hosting and Postgres, run `pnpm db:migrate` in the deploy pipeline, set production env vars (`AI_PROVIDER=rules`) and a custom domain. Add error tracking (no request bodies) and an external uptime check, and show uptime on `/open`.
  8. **Launch cards.** Include the five Decision Cards with their Draft labels. Update each card’s review status when a second engineer checks it.
- **Success check:**
  - The first chapter's tutorials (the founder sets the number) are published and reviewed.
  - The site is live, and `pnpm verify` and `pnpm smoke` (extended to `/learn`) pass against it.
  - There are no accessibility errors on the main pages (Lighthouse or axe).
  - The waitlist and X-Ray-to-sign-up rates are tracked from the `events` table.

## M2: Accounts, synced progress and the Blueprint (Planned, Phase 1)

- **Outcome:** a learner signs in, keeps their tutorial progress across devices, creates a project (optionally from an X-Ray), records decisions from cards and tutorials, and sees their Blueprint grow.
- **Needs first:** M1, and ADR 0010 approved (auth library and sign-in methods).
- **Scope:**
  - Auth and the Phase 1 tables (see architecture.md).
  - Browser progress migrates to the account on first sign-in.
  - A project page with the App Life Path for that project.
  - "Use this option" on card options writes a `project_decisions` row.
  - The X-Ray result's "Start a project from this" pre-fills traits and the decided items.
  - Nonce-based CSP.
- **Success check:**
  - Every new endpoint has two-user access tests.
  - A learner can go from an X-Ray to a Blueprint with 10 decisions in one sitting (usability test with five people).

## M3: Build Pack, achievements and payments (Planned, Phase 1)

- **Outcome:** a learner exports a Build Pack their AI tool follows, sees progress and achievements, and can pay.
- **Scope:**
  - Build Pack v1: `AGENTS.md`, `SPEC.md`, `TASKS.md`, and adapters for Lovable, Cursor and Claude Code, built from `renderAgentsMd` and its siblings.
  - The Decision Deck, weekly goals, the first badges and ranks 0–2.
  - More tutorials and cards (30 cards in total) at depths 1–3.
  - One Crash Theater scenario.
  - Merchant-of-record checkout, with webhooks into `subscriptions`, and plan gating. **Payments provider and prices: awaiting founder.**
- **Success check:** Gate B from the product plan (for example, 50 paying learners and 25% still active at day 30).

## M4: Proof: Twin Builds Lab results (Planned, Phase 2)

- **Outcome:** the first published episode, with every metric measured on both twins and the raw output public.
- **How it is produced:** offline, by the founder with Claude Code following [lab/README.md](../lab/README.md) and the methodology. The product never calls an AI API for this. The site only publishes the episode YAML and links to the raw artifacts.
- **Scope:**
  - Build the two twins.
  - Run the harness in `lab/` against both.
  - Publish the artifacts.
  - Fill in the episode YAML; the schema blocks publishing without every metric.
  - Video.
- **Success check:** an outside developer can rerun the harness from the published instructions and get comparable numbers.

## M5: Reality Check and the Reality Score (Planned, Phase 2)

- **Outcome:** learners scan their own live app and get a score with fix prompts.
- **Scope:**
  - Ownership verification (DNS TXT record or file).
  - Passive checks only: TLS, headers, secrets in bundles, exposed paths, Lighthouse.
  - A background worker (needs an ADR).
  - Rank 3 (Shipper) unlocks through Reality Check.
- **Constraint:** never scan unverified sites; never run active attacks.

## M6: Senior ecosystem (Deferred, Phase 3)

The VibeAcademy agent skill and MCP server, depth 5 across the library, certificates, team and campus plans, and the AWS migration as public content.

## Later: AI features (Deferred)

Everything that would call a paid model API from the product. The code path exists and is tested, but it is switched off. Nothing here starts without a founder decision on budget (open decision 4).

**AI-assisted X-Ray.** Already built:

- the gateway with cache, daily budget, usage ledger, retries and timeout;
- the Anthropic provider using structured outputs;
- the `xray.classify` feature, with its prompt and schema.

All of it is tested against mocked HTTP only. To switch it on:

1. Check that the rule-based fixtures from M1 step 6 exist. They are the baseline the AI must beat.
2. Run the fixtures once against the API with a small key and a low `AI_DAILY_BUDGET_USD`, and record the agreement, tokens and cost per run in `docs/architecture.md`.
3. Switch on only if it clearly beats the rule-based check. Set `AI_PROVIDER=anthropic` and `ANTHROPIC_API_KEY`, verify the provider's retention and training terms, and update `/privacy` before the switch.
4. Keep the rule-based check as the fallback when the budget runs out.

**AI mentor.** A new `AiFeature` grounded in cards and tutorials, after M2 (it needs accounts for fair limits).
