# Project status

Last updated on 2026-11-21 during M1 tutorial development. Update this file in the same change as the work it describes.

## Implemented and verified

Re-verified on 2026-11-18 after ADR 0011: `pnpm verify` passed (77 tests, content check, production build), and `pnpm smoke` passed every check against a production build started with no AI settings. A browser check of the X-Ray result showed the "Rule-based check" label, with no console errors.

| Area | What exists | Verified by |
| --- | --- | --- |
| Tutorial format | Markdown with typed YAML frontmatter, shared taxonomy IDs, and HTML escaped in lesson bodies ([ADR 0012](decisions/0012-tutorial-markdown.md)) | Tutorial format tests cover metadata, delimiters, code examples and link handling |
| Tutorial library and authoring | The loader orders lessons by chapter and the founder's optional sequence. The content checker validates prerequisite chains and related cards. [Template](../content/tutorials/_template.md) and [authoring guide](content-guide.md) are ready. The launch curriculum awaits the founder. | Content tests exercise real files, the template, ordering, invalid filenames and broken links. `pnpm content:check` reports lesson counts by review state. |
| Landing page | Hero with X-Ray launcher, ghost floor plan, silent-decision examples, how it works (with honest availability tags), card list, Lab teaser, waitlist | Production build, smoke test, screenshots |
| Prompt X-Ray | Prompt input (20–4,000 chars), analysis, score on a band scale with critical cap, 12-domain floor plan, top 3 risks, upgraded prompt (assembled in the browser), AGENTS.md starter download, all-decisions list, "Rule-based check" label on every result | Unit, integration and route tests; smoke test; browser run |
| Sharing | Opt-in share link via owner token, public summary page without prompt or app type, Open Graph image, unshare, delete | Integration tests, smoke test |
| Analysis gateway | Provider abstraction (`rules`, the default rule-based check; Anthropic structured outputs, deferred and opt-in), feature definitions, cache keyed by versions + provider + model + prompt HMAC, daily budget, timeout, one retry, usage ledger with costs, kill switches | `tests/server/gateway.test.ts`, `anthropic-provider.test.ts` (mocked HTTP) |
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
| Rule-based X-Ray quality | Keyword rules for 7 traits, 11 app types and 36 decisions | Never measured against labelled prompts. M1 step 6 adds hand-labelled fixtures and an agreement test. |
| Build Pack | AGENTS.md starter from an X-Ray; Blueprint types and renderer | SPEC.md, TASKS.md, tool adapters, Blueprint persistence. M2–M3. |
| App Life Path | Static page of chapters with the cards that exist | Personal path per project. M2. |
| Lab harness | Scripts and configs in `lab/` | Never run against real builds. M4. |
| CI | `.github/workflows/ci.yml` | Has not run on GitHub yet. |

## Planned (designed, not built)

M1 `/learn` path, tutorial page, browser progress, first reviewed tutorials and the founder's design pass ([roadmap.md](roadmap.md)). Then accounts and authorisation (ADR 0010, proposed), Phase 1 tables (architecture.md), Blueprint, Build Pack v1, progress and ranks, Crash Theater, payments, Reality Check, mentor, agent skill. See [roadmap.md](roadmap.md).

## Deferred on purpose

| Item | Why |
| --- | --- |
| Third-party analytics and session replay | First-party events cover Phase 0 (ADR 0007). |
| Light theme | Tokens are centralised; not needed to validate demand. |
| Nonce-based CSP | Planned for M2; current CSP still blocks third-party scripts, frames and connections. |
| Browser end-to-end tests in CI (Playwright) | The smoke script covers the journey over HTTP; add Playwright when the UI has more interaction (M2). |
| Translations | English first; content schema supports adding locale fields later. |
| AI-assisted X-Ray and AI mentor | Founder decision: no paid API spend for now (ADR 0011). The Anthropic provider is built and tested against mocks, switched off unless `AI_PROVIDER=anthropic`. See roadmap, "Later: AI features". |

## Awaiting founder

See [open-decisions.md](open-decisions.md): the design brief ([design-brief.md](design-brief.md), still a blank template), the first tutorials, brand name confirmation, card review, auth choice, email provider, payments provider and prices, hosting account, legal privacy policy.

## Known limitations

- The rule-based check is keyword matching: it can miss a decision phrased in unusual words and can credit one that is only mentioned. It is labelled "Rule-based check" everywhere.
- Local development databases created before ADR 0011 may hold rows with `mode = 'simulated'`; delete `.data/pglite` to reset.
- Rate limiting trusts `x-forwarded-for`; deploy behind a proxy that sets it.
- PGlite is development-only and single-process.
- The privacy page is a plain-language summary, not a lawyer-reviewed policy.
