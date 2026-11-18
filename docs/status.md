# Project status

Last updated: 2026-11-18, at the end of the Phase 0 generation. Update this file in the same change as the work it describes.

## Implemented and verified

| Area | What exists | Verified by |
| --- | --- | --- |
| Landing page | Hero with X-Ray launcher, ghost floor plan, silent-decision examples, how it works (with honest availability tags), card list, Lab teaser, waitlist | Production build, smoke test, screenshots |
| Prompt X-Ray | Prompt input (20–4,000 chars), analysis, score on a band scale with critical cap, 12-domain floor plan, top 3 risks, upgraded prompt (assembled in the browser), AGENTS.md starter download, all-decisions list, simulated-mode label | Unit, integration and route tests; smoke test; browser run |
| Sharing | Opt-in share link via owner token, public summary page without prompt or app type, Open Graph image, unshare, delete | Integration tests, smoke test |
| AI gateway | Provider abstraction (Anthropic structured outputs; simulated), feature definitions, cache keyed by versions + provider + model + prompt HMAC, daily budget, timeout, one retry, usage ledger with costs, kill switches | `tests/server/gateway.test.ts`, `anthropic-provider.test.ts` (mocked HTTP) |
| Scoring | 36 decisions, 12 domains, 7 traits, applicability rules, weights, critical cap, bands, top risks, versioned | `tests/domain/*` |
| Privacy | No prompt text stored, cached, logged or returned; HMAC'd IPs; owner tokens hashed | Test that searches every table for a prompt phrase |
| Security | Security headers, same-origin checks, JSON size limits, Zod validation, rate limits, production config guards | Route tests, smoke test |
| Decision Cards | Schema with the 8 parts, 5 cards (all `draft`), Depth Dial (keyboard accessible, remembered), App Life Path page | Content tests, `pnpm content:check`, browser run |
| Twin Builds Lab | Methodology (11 metrics), episode schema that forbids unpublished numbers, episode 1 planned, fight card that shows "Not measured yet" | Content tests |
| `/open` | Live counts, cache hit rate, AI spend, average cost per paid call, budget cap, waitlist size | Integration test, smoke test |
| Waitlist | Email, tool, experience, consent; no enumeration; rate-limited | Integration tests, smoke test |
| Tooling | TypeScript strict, ESLint with boundary rules, Vitest, content check, migrations, smoke script, CI workflow | Ran locally (CI itself not yet run on GitHub) |

## Partially implemented

| Item | State | What is missing |
| --- | --- | --- |
| Real AI analysis | Anthropic provider written and tested against a mocked API | Never called the real API (no key in the generation environment). Classifier accuracy and real token counts are unmeasured. M1. |
| Build Pack | AGENTS.md starter from an X-Ray; Blueprint types and renderer | SPEC.md, TASKS.md, tool adapters, Blueprint persistence. M2–M3. |
| App Life Path | Static page of chapters with the cards that exist | Personal path per project. M2. |
| Lab harness | Scripts and configs in `lab/` | Never run against real builds. M4. |
| CI | `.github/workflows/ci.yml` | Has not run on GitHub yet. |

## Planned (designed, not built)

Accounts and authorisation (ADR 0010, proposed), Phase 1 tables (architecture.md), Blueprint, Build Pack v1, progress and ranks, Crash Theater, payments, Reality Check, mentor, agent skill. See [roadmap.md](roadmap.md).

## Deferred on purpose

| Item | Why |
| --- | --- |
| Third-party analytics and session replay | First-party events cover Phase 0 (ADR 0007). |
| Light theme | Tokens are centralised; not needed to validate demand. |
| Nonce-based CSP | Planned for M2; current CSP still blocks third-party scripts, frames and connections. |
| Browser end-to-end tests in CI (Playwright) | The smoke script covers the journey over HTTP; add Playwright when the UI has more interaction (M2). |
| Translations | English first; content schema supports adding locale fields later. |

## Awaiting founder

See [open-decisions.md](open-decisions.md): brand name confirmation, card review, auth choice, email provider, payments provider and prices, hosting account, legal privacy policy.

## Known limitations

- Simulated mode is crude keyword matching. It exists only so the interface can be explored without a key, and it is labelled everywhere.
- Rate limiting trusts `x-forwarded-for`; deploy behind a proxy that sets it.
- PGlite is development-only and single-process.
- The privacy page is a plain-language summary, not a lawyer-reviewed policy.
