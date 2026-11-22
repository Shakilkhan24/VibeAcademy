# Project status

Last updated on 2026-11-22 during M1 verification. Update this file in the same change as the work it describes.

## Implemented and verified

The founder approved the three Dream tutorials for the initial chapter on 2026-11-22. Their review status appears on the learning path and each lesson. The bakery exercise now supplies two complete orders, a copyable build prompt with both acceptance checks, and a third order for the learner to try. The scope card includes a test for two-sided products.

The storage card now gives separate checks for a database, a manual inbox or sheet, and a static page. The recovery card checks records on both sides of the chosen recovery point. A local drill restored an embedded Postgres snapshot to a separate instance and verified both the recovered and source records. Hosted point-in-time recovery still requires a provider-specific drill.

The access card now tests both a private order and a deliberately public listing. The credentials card checks server settings, a vault or provider-designated browser keys according to the option selected. All 15 distinct source URLs in the cards, tutorials and product context opened. The five cards are drafts pending a second engineer's review.

On 2026-11-22, `pnpm verify` passed type checking, lint, all 112 tests, content validation and the production build. The production journey passed 38 HTTP checks with the rule-based provider on both embedded Postgres and a disposable PostgreSQL 17 server. The PostgreSQL run also checked failure reporting before migration and preserved the signup across a second migration. Chromium checks at 390 px and 1280 px verified the reviewed labels on the learning path and all three readers. Earlier checks covered all eight learning pages, clipboard, completion and signup metrics. The founder chose GitHub delivery for this pass and deferred public deployment.

| Area | What exists | Verified by |
| --- | --- | --- |
| Tutorial format | Markdown with typed YAML frontmatter, shared taxonomy IDs, and HTML escaped in lesson bodies ([ADR 0012](decisions/0012-tutorial-markdown.md)) | Tutorial format tests cover metadata, delimiters, code examples and link handling |
| Learning path and reader | Home and navigation link to `/learn`. All seven chapters appear in order. Three reviewed Dream lessons have reader pages with contents, prerequisite and Decision Card links, copyable examples, callouts and adjacent lessons. The sitemap and share images cover the new routes. | Content tests and production smoke checks cover reader pages, missing slugs, sitemap and share images. |
| Accessibility | The Lab and transparency tables support keyboard scrolling inside the page width. | Chromium desktop and mobile journey checks and axe WCAG A/AA checks on the learning path and main pages |
| Tutorial progress | Visitors can mark and unmark lessons. The learning path shows completed lessons and the total. Separate browser storage keys allow open tabs to update different lessons independently. | Production smoke test plus Chromium checks for reloads, cross-tab updates and unavailable storage |
| Tutorial library and authoring | The loader orders lessons by chapter and the founder's optional sequence. The content checker validates prerequisite chains and related cards. [Template](../content/tutorials/_template.md) and [authoring guide](content-guide.md) are ready. Three reviewed Dream lessons cover a user and job (Story), the first workflow (Practical), and a testable prompt (Technical). | Content tests exercise real files, the template, ordering, invalid filenames and broken links. `pnpm content:check` reports lesson counts by review state. |
| Landing page | Hero with X-Ray launcher, ghost floor plan, silent-decision examples, how it works (with honest availability tags), card list, Lab teaser, waitlist | Production build, smoke test, screenshots |
| Prompt X-Ray | Prompt input (20–4,000 chars), analysis, score on a band scale with critical cap, 12-domain floor plan, top 3 risks, upgraded prompt (assembled in the browser), AGENTS.md starter download, all-decisions list, "Rule-based check" label on every result | Unit, integration and route tests; smoke test; browser run |
| Sharing | Opt-in share link via owner token, public summary page without prompt or app type, Open Graph image, unshare, delete | Integration tests, smoke test |
| Analysis gateway | Provider abstraction (`rules`, the default rule-based check; Anthropic structured outputs, deferred and opt-in), feature definitions, cache keyed by versions + provider + model + prompt HMAC, daily budget, timeout, one retry, usage ledger with costs, kill switches | `tests/server/gateway.test.ts`, `anthropic-provider.test.ts` (mocked HTTP) |
| Rule-based X-Ray quality | Taxonomy v2 recognises more ways to state ownership, secret storage and recovery. Payment confirmation requires a named provider and payment-specific confirmation evidence. | On 24 hand-labelled prompts, agreement rose from 72/96 (75%) to 94/96 (97.9%). CI enforces the founder-approved 80% target on this fixture set. |
| Scoring | 36 decisions, 12 domains, 7 traits, applicability rules, weights, critical cap, bands, top risks, versioned | `tests/domain/*` |
| Privacy | No prompt text stored, cached, logged or returned; HMAC'd IPs; owner tokens hashed | Test that searches every table for a prompt phrase |
| Security | Security headers, same-origin checks, JSON size limits, Zod validation, rate limits, production config guards | Route tests, smoke test |
| Decision Cards | Schema with the 8 parts, 5 cards (all `draft`), Depth Dial (keyboard accessible, remembered), App Life Path page | Content tests, `pnpm content:check`, browser run |
| Twin Builds Lab | Methodology (11 metrics), episode schema that forbids unpublished numbers, episode 1 planned, fight card that shows "Not measured yet" | Content tests |
| `/open` | Live counts, cache hit rate, AI spend, average cost per paid call, budget cap and waitlist size. First-party events give the rolling 30-day signup pace and signups from the X-Ray link per 100 completed checks. | Integration tests cover duplicates, missing denominators, older unattributed events and the reporting window. The production smoke test reads the metrics on `/open`. |
| Waitlist | Email, tool, experience, consent; no enumeration; rate-limited | Integration tests, smoke test |
| Database readiness | `/api/health` checks that the application role can read all six Phase 0 tables without fetching any rows. An inaccessible table makes the endpoint return 503. | Route tests cover a migrated database and a reachable database missing the waitlist table. |
| API error tracking | API failures with a 5xx status produce a structured server log identifying the operation, status and code. A failed analytics write records its event name and lets the request finish. | Regression tests exercise an unavailable waitlist table, an unavailable analytics table, a paused X-Ray, readiness failure and invalid input. |
| Server request error tracking | Uncaught request failures produce a server log with the route kind and site area. | The production PostgreSQL test exercises a failed shared-result lookup and checks server stderr for the failure record and the absence of the visitor's share slug and query string. |
| Tooling | TypeScript strict, ESLint with boundary rules, Vitest, content check, migrations, smoke script, CI workflow | Local verification and the GitHub Actions verify job passed. The secret scan uses a finding-specific exception for the historical smoke-test fixture. |

## Partially implemented

| Item | State | What is missing |
| --- | --- | --- |
| Build Pack | AGENTS.md starter from an X-Ray; Blueprint types and renderer | SPEC.md, TASKS.md, tool adapters, Blueprint persistence. M2–M3. |
| App Life Path | Static page of chapters with the cards that exist | Personal path per project. M2. |
| Lab harness | Scripts and configs in `lab/` | Never run against real builds. M4. |

## Planned (designed, not built)

M1 card review and launch ([roadmap.md](roadmap.md)). Then accounts and authorisation (ADR 0010, proposed), Phase 1 tables (architecture.md), Blueprint, Build Pack v1, progress and ranks, Crash Theater, payments, Reality Check, mentor, agent skill. See [roadmap.md](roadmap.md).

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

See [open-decisions.md](open-decisions.md): brand name confirmation, card review, auth choice, email provider, payments provider and prices, hosting account, legal privacy policy.

## Known limitations

- The rule-based check is keyword matching: it can miss a decision phrased in unusual words and can credit one that is only mentioned. It is labelled "Rule-based check" everywhere.
- Local development databases created before ADR 0011 may hold rows with `mode = 'simulated'`; delete `.data/pglite` to reset.
- Rate limiting trusts `x-forwarded-for`; deploy behind a proxy that sets it.
- PGlite is development-only and single-process.
- The privacy page is a plain-language summary, not a lawyer-reviewed policy.
