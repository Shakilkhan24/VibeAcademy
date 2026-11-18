# AGENTS.md: SeniorSeat

Instructions for any AI coding agent (and human) working in this repository. Start with [START_HERE.md](START_HERE.md) if you have not read it. For anything visual, [docs/design-brief.md](docs/design-brief.md) is the founder's direction and wins over the current look.

## What this product is

SeniorSeat teaches vibe coders to make the engineering decisions a senior engineer makes. Its philosophy is in [docs/product.md](docs/product.md): teach decisions, not tools; at the right depth; at the right moment; and prove that better decisions produce better software. SeniorSeat is itself built that way: decide first, record the decision, then let AI build.

## Commands

| Task | Command |
| --- | --- |
| Install | `pnpm install` |
| Develop | `pnpm dev` (rule-based X-Ray; no API key needed) |
| Type check | `pnpm typecheck` |
| Lint (includes architecture boundaries) | `pnpm lint` |
| Unit and integration tests | `pnpm test` |
| Content validation | `pnpm content:check` |
| Everything before a PR | `pnpm verify` |
| New migration after editing the schema | `pnpm db:generate` (commit the SQL) |
| Apply migrations to `DATABASE_URL` | `pnpm db:migrate` |
| End-to-end smoke test against a running server | `BASE_URL=http://localhost:3000 pnpm smoke` |

## Architecture you must respect

- `src/domain` is pure: no React, Next.js, Node APIs, database or network. Scoring, taxonomy, prompt upgrade and Build Pack generation live here and are tested exhaustively.
- `src/server` is server-only (`import "server-only"`). Services take an explicit `AppContext` (`src/server/context.ts`) so tests can inject a database and an AI provider.
- `src/components` never imports `src/server` or `src/content`. Routes in `src/app` fetch data and pass it in as props.
- Every model call goes through `AiGateway.run(feature, input)`. To add an AI use, write an `AiFeature` in `src/server/ai/features/` (prompt, schema, version, limits), never a direct `fetch` to a provider.
- Configuration comes only from `loadConfig()` in `src/server/env.ts`. Add new variables there and to `.env.example`.

## Non-negotiables

1. **Prompt privacy.** Raw prompts are never stored, logged, cached as text or returned in responses. The X-Ray stores an HMAC and the classification only. `tests/server/xray-service.test.ts` proves it; extend that test when you add storage.
2. **Honest modes.** Results carry `mode: "ai" | "rules"`. Every surface that shows a result shows the "Rule-based check" label when it applies. AI-assisted analysis is deferred ([ADR 0011](docs/decisions/0011-rules-first-ai-deferred.md)): do not switch it on or spend on an API without the founder.
3. **Deterministic scoring.** The AI only classifies. Any change to scoring rules bumps `SCORING_VERSION`; any change to decisions, weights, applicability or classifier criteria bumps `TAXONOMY_VERSION`; any change to the classifier prompt bumps `XRAY_PROMPT_VERSION`.
4. **No invented evidence.** No hard-coded metrics, testimonials, prices presented as final, or Lab results. Lab numbers come only from published episodes that pass `EpisodeSchema`.
5. **Accessible and respectful UI.** Keyboard reachable, visible focus, labelled controls, reduced motion respected. Copy never mocks vibe coders.
6. **Secrets stay on the server.** Never prefix a secret with `NEXT_PUBLIC_`. Never commit `.env*` files other than `.env.example`.

## How to work

1. **Understand first.** Read the relevant docs and code, and run the tests, before editing.
2. **Plan the change.** For anything non-trivial, write the plan (files, risks, how you will verify) before coding. If it changes architecture, draft an ADR in `docs/decisions/`.
3. **Small steps.** One milestone task at a time from [docs/roadmap.md](docs/roadmap.md). Keep each change reviewable.
4. **Tests with the change.** Domain logic: unit tests. Services: integration tests with `createTestContext()` (real embedded Postgres). Routes: handler tests. UI journeys: extend `scripts/smoke.mjs`.
5. **Verify for real.** Run `pnpm verify`. For UI changes, run the app and look at it. Do not claim something works because it compiles.
6. **Keep the record current.** Update [docs/status.md](docs/status.md) in the same change. Record new decisions as ADRs. List assumptions and unresolved questions in your summary.
7. **Do not decide founder questions.** Pricing, brand, payment provider, legal text and anything in [docs/open-decisions.md](docs/open-decisions.md) need the founder. Make a reversible provisional choice only if work is blocked, and mark it clearly.

## Conventions

- TypeScript strict, `noUncheckedIndexedAccess` on. No `any` without a comment explaining why.
- Zod validates every external input (requests, model output, content files, env).
- User-facing copy: sentence case, plain words, active voice, no all-caps labels, errors that say what to do next. See [docs/design-system.md](docs/design-system.md).
- Styling: Tailwind with the tokens in `src/app/globals.css`. Reuse `src/components/ui` primitives before creating new ones.
- Content: edit YAML in `content/`, follow [docs/content-guide.md](docs/content-guide.md), bump card `version` for substantive changes, run `pnpm content:check`.
- Commits: small, imperative subject lines ("Add Blueprint decision table").

## When you are unsure

Prefer the simpler option that keeps decisions reversible, write down the assumption in your summary and in `docs/status.md`, and continue. Ask only when the choice affects product direction, security, money or something hard to undo.
