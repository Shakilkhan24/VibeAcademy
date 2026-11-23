# Generation report

What was generated, how it was verified, which choices were made and why, and what remains. Written at the end of the generation session on 2026-11-18.

## Summary

SeniorSeat's Phase 0 is a working, tested Next.js application: about 5,100 lines of TypeScript in `src/`, 900 lines of tests, 5 Decision Cards, Lab content and harness, and full agent-oriented documentation. A visitor can X-ray a prompt, see the decisions it leaves to the AI across 12 domains, read the top risks, copy an upgraded prompt, download an AGENTS.md starter, share a score without exposing the prompt, read Decision Cards at five depths and join the waitlist.

The AI path is complete but has **not** been exercised against the real Anthropic API, because no API key was available in the generation environment. Every result produced during verification came from the clearly labelled keyword-rule mode.

### Update after generation (2026-11-18)

At the founder's direction, the project is now tutorials-first and paid AI is deferred ([ADR 0011](docs/decisions/0011-rules-first-ai-deferred.md)):

- The keyword-rule provider was renamed from `simulated` to `rules` and is now the default engine in every environment, labelled "Rule-based check". `ALLOW_SIMULATED_AI` was removed.
- The Anthropic provider is opt-in only (`AI_PROVIDER=anthropic`).
- M1 was rewritten around tutorials, and `docs/design-brief.md` and `docs/agent-prompts.md` were added.
- After the change, `pnpm verify` and the smoke test were re-run; see [docs/status.md](docs/status.md).

The tables below describe the original generation run. Where they mention "simulated" mode or `ALLOW_SIMULATED_AI`, read "rule-based check".

## Verification results

All commands were run in the generation environment (Linux, Node 22.23, pnpm 10.28).

| Check | Command | Result |
| --- | --- | --- |
| Dependency install | `pnpm install` | Pass |
| Type check | `pnpm typecheck` (TypeScript 5.9, strict, `noUncheckedIndexedAccess`) | Pass, 0 errors |
| Lint with architecture boundaries | `pnpm lint` (ESLint 9, `eslint-config-next`, boundary rules) | Pass, 0 problems |
| Unit and integration tests | `pnpm test` (Vitest 5) | **77 passed, 0 failed**, 11 files |
| Content validation | `pnpm content:check` | Pass: 5 cards (all draft), methodology v1 with 11 metrics, 1 episode |
| Production build | `pnpm build` (Next.js 16.4.6, Turbopack) | Pass, 17 static pages generated |
| Migrations | `pnpm db:migrate` against embedded PGlite | Pass |
| End-to-end smoke test | `pnpm smoke` against `next start` (production build, simulated AI allowed) | **27 of 27 checks passed** |
| Clean install from the ZIP | Extracted into an empty folder, then `pnpm install --frozen-lockfile && pnpm verify` | Pass: 77 tests, content check, production build |
| Zero-config development mode | `pnpm dev` from the extracted ZIP with no `.env`, then `pnpm smoke` | **27 of 27 passed**; embedded database created automatically in `.data/pglite` |
| Browser run | Chrome via Playwright: home to X-Ray journey, share, Depth Dial, all pages, desktop and mobile | Journey completed; no console errors after adding the favicon; screenshots in `docs/screenshots/` |

What the tests cover, by file:

| File | Covers |
| --- | --- |
| `tests/domain/taxonomy.test.ts` | 12 domains × 3 decisions, unique ids, critical weights, applicability (all-of, any-of) |
| `tests/domain/scoring.test.ts` | 0 and 100 scores, partial value, non-applicable exclusion, critical cap, top-risk ordering, per-domain coverage, determinism, bands |
| `tests/domain/classification.test.ts` | Normalising model output: missing ids, unknown ids, casing, duplicates, bad shapes |
| `tests/domain/prompt-upgrade-and-build-pack.test.ts` | Upgraded prompt order and scope; AGENTS.md from X-Ray and from a Blueprint |
| `tests/server/ai-feature.test.ts` | JSON schema meets structured-output rules (closed objects, all required); prompt-injection wrapper; pricing |
| `tests/server/anthropic-provider.test.ts` | Request shape (`output_config.format`, headers), retryable vs non-retryable errors, refusals, truncation, bad JSON (mocked HTTP) |
| `tests/server/gateway.test.ts` | Cache hit at zero cost, simulated/real cache isolation, daily budget, retry, invalid output recorded, disabled provider |
| `tests/server/xray-service.test.ts` | Result shape, AI vs simulated labelling, **no prompt text in any table or response**, validation, rate limits, kill switch, cache by normalised prompt, owner-only sharing, unshare, delete, slug validation |
| `tests/server/waitlist-and-config.test.ts` | Email normalisation, no enumeration, consent, config rules for production, `/open` metrics |
| `tests/server/api-routes.test.ts` | Real route handlers: the full journey, cross-site rejection, input errors, waitlist, health |
| `tests/content/content.test.ts` | Card structure, chapter coverage, cross-links, Lab honesty rules |

## What is mocked, simulated, or needs credentials

| Item | State |
| --- | --- |
| Anthropic API | Provider tested only with mocked HTTP responses. Needs `ANTHROPIC_API_KEY` to run for real. The request format follows the current structured-outputs documentation. |
| Simulated analysis | Keyword rules used for development and all verification runs. Labelled "simulated" in the API (`mode`), the result page, the share page and `/open`. Refused in production unless `ALLOW_SIMULATED_AI=true`. |
| Production Postgres | Code path (`postgres-js`) written; not run against a real server. PGlite (real Postgres in WASM) was used for every database test. |
| CI | `.github/workflows/ci.yml` written; it has not run on GitHub. |
| Lab harness | k6, ZAP, Lighthouse and secret-scan scripts written and syntax-checked; never run against real builds. |
| Model pricing | Taken from the pricing documentation on 2026-11-18 (Haiku 5.5: $0.10 / $0.50 per million tokens). |

## Architectural choices, and where they depart from the product plan

| Plan suggested | Chosen | Why |
| --- | --- | --- |
| Monorepo (`apps/`, `packages/`) | One Next.js app; boundaries enforced by ESLint and `server-only` | One deployable and one developer; package boundaries would add config without a second consumer (ADR 0001). |
| Supabase or Neon only | Drizzle + one Postgres schema; PGlite for development and tests, Postgres in production | Zero-setup development and real-SQL tests, no SQLite dialect drift (ADR 0003). |
| AI rewrites the prompt | Deterministic upgrade from decision prompt lines, assembled in the browser | Explainable, free, never invents requirements, and the server never echoes the prompt (ADR 0002, 0005). |
| A radar chart for coverage | A 12-room floor plan with hatching | Radar charts distort area across 12 axes; rooms read at a glance and carry the brand's blueprint idea. |
| PostHog and Sentry | First-party events table; Sentry deferred to M1 | No third-party processors or cookies before launch; `/open` reads the same data (ADR 0007). |
| shadcn/ui, Motion, React Flow | Tailwind v4 tokens with hand-built primitives; CSS motion; no React Flow yet | Few components needed, a distinctive look, smaller bundle; React Flow arrives with Crash Theater (ADR 0009). |
| pg-boss or Inngest | No queue yet | Nothing in Phase 0 runs in the background. A worker comes with Reality Check (M5). |
| Anthropic SDK | Plain `fetch` provider | One endpoint; the gateway owns retries and timeouts; trivial to mock (ADR 0004). |
| MDX content | YAML validated by Zod | Content stays content; schemas enforce the 8-part card and the Lab honesty rule (ADR 0008). |
| `next/font/google` | Self-hosted `@fontsource` fonts | Builds need no network; no third-party font requests. |

## Assumptions made

- English-first, global audience (per the founder's instruction to remove locale-specific content).
- “SeniorSeat” was the working name during generation. The founder selected VibeAcademy on 2026-11-23. Screenshots from this session show the original name. [Brand decision](docs/open-decisions.md#resolved-for-m1)
- The deployment sits behind a proxy that sets `x-forwarded-for` (true for Vercel, Render, Fly.io and Cloudflare).
- Default limits: 3 X-Rays per minute and 8 per day per visitor; daily AI budget $2. All configurable by environment variables.
- The five cards are drafts written for expert review. Their facts are general engineering knowledge; the one statistic used (the Escape scan) is cited on the card.

## Remaining work

The next milestone is **M1: tutorials website, ready for the first public visitors** ([docs/roadmap.md](docs/roadmap.md)). It covers the founder's design pass, the tutorial content type and `/learn` path, browser-side progress, an authoring workflow, hand-labelled fixtures for the rule-based X-Ray, deployment with monitoring, and card review. Paid AI analysis is deferred. Founder decisions that gate later milestones are listed in [docs/open-decisions.md](docs/open-decisions.md).

## Repository map

```
START_HERE.md  AGENTS.md  CLAUDE.md  README.md  GENERATION_REPORT.md
src/domain      taxonomy (12 domains, 36 decisions), scoring, prompt upgrade, Build Pack, content schemas
src/server      env, db (schema, client), ai (gateway, providers, features, pricing), services, security, http
src/content     YAML loaders and integrity check
src/components  ui primitives, layout, xray, cards, lab, waitlist
src/app         pages: /, /xray, /x/[slug] (+ OG image), /cards, /cards/[slug], /lab, /lab/[slug], /open, /waitlist, /privacy; API: /api/xray, /api/xray/share, /api/waitlist, /api/health
content/        cards/*.yaml (5), lab/methodology.yaml, lab/episodes/*.yaml
drizzle/        0000_init.sql
tests/          domain, server, content, support
scripts/        check-content.ts, migrate.ts, smoke.mjs
lab/            k6, zap, lighthouse, secrets, access-test
docs/           product, architecture, decisions (10 ADRs), roadmap, status, open-decisions, design-system, content-guide, privacy, testing, screenshots
.github/        workflows/ci.yml
```
