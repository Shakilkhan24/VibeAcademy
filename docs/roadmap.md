# Roadmap

Outcome-based milestones in dependency order. Each one opens only when the one before it meets its success check. The product plan's phases map onto them: Phase 0 = M0–M1, Phase 1 = M2–M3, Phase 2 = M4–M5, Phase 3 = M6.

Status key: **Done**, **Next**, **Planned**, **Deferred**, **Awaiting founder** (see [open-decisions.md](open-decisions.md)).

## M0: Phase 0 foundation (Done)

- **Outcome:** a visitor can X-ray a prompt, understand the gaps, get an upgraded prompt, share a score without exposing the prompt, read Decision Cards and join the waitlist.
- **Verified by:** `pnpm verify` and `pnpm smoke` (see GENERATION_REPORT.md).

## M1: Real analysis, ready for the first public visitors (Next)

- **Outcome:** the X-Ray runs on real AI with measured quality and cost, live on a public URL, with reviewed cards.
- **Why it matters:** Phase 0 exists to validate demand; that needs real analysis in front of real people.
- **Needs first:** an Anthropic API key, a hosting account, a Postgres database, founder review time for the cards.
- **Scope:**
  1. Run real classifications on 30–50 varied prompts (beginner, expert, non-English, non-software, injection attempts). Store them as labelled fixtures in `tests/fixtures/prompts/` with expected statuses, and add a quality test (for example, at least 90% status agreement on critical decisions).
  2. Tune the classifier prompt and criteria (bump `XRAY_PROMPT_VERSION` / `TAXONOMY_VERSION`); record measured tokens and cost per run in `docs/architecture.md`.
  3. Deploy: hosting, Neon or Supabase, `pnpm db:migrate` in the deploy pipeline, production env vars, custom domain.
  4. Error tracking (Sentry or similar, no request bodies) and an external uptime check; show uptime on `/open`.
  5. Founder reviews the five cards; flip `status` to `reviewed`.
  6. Waitlist email confirmation (double opt-in) once an email provider is chosen. **Awaiting founder.**
- **Success check:** 50 real X-Rays in production; median cost per uncached analysis published on `/open`; zero prompt text in any table (re-run the privacy test against a production snapshot); Gate A from the product plan (for example 300 waitlist sign-ups and 10% X-Ray-to-sign-up) tracked from the `events` table.

## M2: Accounts and the Blueprint (Planned, Phase 1)

- **Outcome:** a learner signs in, creates a project (optionally from an X-Ray), records decisions from cards, and sees their Blueprint grow.
- **Needs first:** M1; ADR 0010 approved (auth library and sign-in methods).
- **Scope:** auth; Phase 1 tables (see architecture.md); project page with the App Life Path for that project; "Use this option" on card options writes a `project_decisions` row; X-Ray result "Start a project from this" pre-fills traits and decided items; nonce-based CSP.
- **Success check:** two-user access tests on every new endpoint; a learner can go from X-Ray to a Blueprint with 10 decisions in one sitting (usability test with five people).

## M3: Build Pack, progress and payments (Planned, Phase 1)

- **Outcome:** a learner exports a Build Pack their AI tool follows, sees progress, and can pay.
- **Scope:** Build Pack v1 (`AGENTS.md`, `SPEC.md`, `TASKS.md`, adapters for Lovable, Cursor, Claude Code) from `renderAgentsMd` and siblings; Decision Deck, weekly goals, first badges, ranks 0–2; 25 more cards (30 total) at depths 1–3; one Crash Theater scenario; merchant-of-record checkout with webhooks into `subscriptions`; plan gating. **Payments provider and prices: awaiting founder.**
- **Success check:** Gate B from the product plan (for example 50 paying learners, 25% active at day 30).

## M4: Proof: Twin Builds Lab results (Planned, Phase 2)

- **Outcome:** the first published episode with every metric measured on both twins and raw output public.
- **Scope:** run the harness in `lab/` against two real builds; publish artifacts; fill the episode YAML (the schema blocks publishing without all metrics); video.
- **Success check:** an outside developer can rerun the harness from the published instructions and get comparable numbers.

## M5: Reality Check and the Reality Score (Planned, Phase 2)

- **Outcome:** learners scan their own live app and get a score with fix prompts.
- **Scope:** ownership verification (DNS TXT or file); passive checks only (TLS, headers, secrets in bundles, exposed paths, Lighthouse); a background worker (ADR needed); rank 3 (Shipper) unlocked by Reality Check.
- **Constraint:** never scan unverified sites; never run active attacks.

## M6: Senior ecosystem (Deferred, Phase 3)

AI mentor grounded in cards (a new `AiFeature`), SeniorSeat agent skill and MCP server, depth 5 across the library, certificates, team and campus plans, and the AWS migration as public content.
