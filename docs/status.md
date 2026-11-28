# Project status

Last updated on 2026-11-29 during M2 (accounts). Update this file in the same change as the work it describes.

## Implemented and verified

**M2 accounts (issue #23, ADR 0010 accepted in #11).** Better Auth runs inside the app with Google as the only sign-in method, and stores users, sessions, encrypted OAuth tokens and OAuth state in Postgres (migration `0002_accounts_and_projects`, which also adds `lesson_completions`, `projects`, `project_decisions` and `xray_runs.user_id`). The header shows "Sign in" or "Your account". `/sign-in` explains when Google is not configured, `/account` shows the profile and signs out, and `GET`/`PATCH /api/account` read and rename only the caller's own account.

Verified on 2026-11-29: a test drives the full Google redirect flow against a stand-in for Google's token and key endpoints, so Better Auth's real ID-token verification runs: sign-in start, callback, session cookie, encrypted token storage, no IP address, sign-out. Other tests cover rejection of email and other providers, expired and tampered sessions, two learners reading and renaming only their own accounts, A signing out while B stays signed in, and the migration applied to an M1 database twice with signups, feedback and an anonymous X-Ray intact. The production smoke test checks the signed-out paths, and the Chromium suite follows "Sign in" at both widths. Real Google sign-in has not been tried: it needs an OAuth client from the founder at deployment.

A PostgreSQL 17 rehearsal created a synthetic waitlist signup, removed it by its verified address and recorded its UTC deletion date with empty event properties. The control signup survived and retrying the request added no second audit event. The database portion finished in under ten seconds locally. [Waitlist deletion procedure](privacy.md#delete-a-waitlist-signup)

The shared footer includes Privacy and Terms. Chromium followed both links at 390 px and 1280 px. All 120 unit and integration tests and 24 browser checks passed, and the HTTP smoke test found both links on all 26 HTML pages it exercises.

Each lesson accepts a Yes or Not yet vote and an optional private comment. The reader can still mark lessons complete locally when offline. The server counts accepted completion marks and feedback responses across lesson versions. On `/open`, each lesson’s completion count and helpful rate appear after its tenth response. [Privacy inventory](privacy.md) · [Reporting decision](decisions/0013-lesson-feedback.md)

For issue #10, `pnpm verify` passed 120 tests and the production build. All 22 browser checks and the PostgreSQL 17 migration and smoke checks passed. A disposable database with nine synthetic responses kept the lesson hidden. A tenth vote made the expected completion count and helpful rate visible at 390 px and 1280 px. Neither private fixture comment appeared in the public response.

The browser suite for issue #9 passed all 20 checks locally at 390 px and 1280 px. Chromium covered X-Ray sharing and revocation, lesson completion across tabs, copying a lesson block, keyboard depth selection and waitlist signup. Axe reported zero serious or critical findings on the home page, learning path, first Dream lesson, X-Ray form and card index at either width. The CI browser job shares the production server with the HTTP smoke tests. [Browser tests and commands](testing.md)

On 2026-11-23, `pnpm verify` passed all 115 tests, content validation and the production build. Route tests covered both IP headers on the X-Ray and waitlist with proxy trust on and off. The production smoke test passed on PostgreSQL 17, including its local header checks. CI now pins its three Node 24 actions by commit and Gitleaks 8.30.1 by image digest. The pinned scanner found no leaks in the local Git history.

GitHub private vulnerability reporting is enabled. The security policy links directly to the private form. Dependabot is configured to group weekly npm updates and GitHub Actions updates separately. [Security policy](../SECURITY.md) · [Dependabot configuration](../.github/dependabot.yml)

The Decision Card library has eleven cards. The five new drafts cover a written spec, sign-in and sessions, logging, rate limits and estimating monthly costs. The previously merged payment card covers the other topic in issue #6. The sign-in decision now opens its own card, and the ownership decision still opens the access card. The founder approved the wording of these five cards on 2026-11-23. Their Draft labels remain pending a second engineer’s review. [Decision Card library](../content/cards/)

On 2026-11-23, all 112 tests, content validation, the production build and HTTP smoke checks passed for the expanded library. In Chromium at 390 px and 1280 px, the shop fixture's three highest risks opened the ownership, backups and secrets cards. Each also appeared under “Learn these first”. All five new readers displayed their five depth explanations and copied both prompt lines at each width.

The founder approved all three First Build lessons on 2026-11-23. Learners check a browser bundle for a harmless rehearsal value, run the same order query as two customer roles and trace a verified payment through to a single packing job. The payment Decision Card now links to the critical payments decision in the X-Ray. Its checkout example is for the fictional bakery. The card awaits second-engineer review. [Keys](../content/tutorials/keep-the-bakery-key-on-the-server.md) · [Orders](../content/tutorials/check-who-can-read-an-order.md) · [Payments](../content/tutorials/confirm-payment-before-packing.md) · [Decision Card](../content/cards/confirm-a-payment.yaml)

On 2026-11-23, all 112 tests, content validation, the production build and the smoke journey passed with nine lessons and six cards. Chromium checks at 390 px and 1280 px covered the new readers, clipboard, completion and the shop X-Ray link to the payment card. A disposable Next.js production build exposed only the public rehearsal label in the checked browser assets. The published SQL isolated Jo and Lee and rolled back its fixtures. A local payment test with a simulated provider produced one packing job under concurrent duplicate confirmation.

Three Blueprint tutorials follow the final Dream exercise. Readers choose an order book for Maya, sketch permissions for the baker, customers and visitors, and turn those choices into a `SPEC.md` to use with the Prompt X-Ray's `AGENTS.md` starter. All three await founder editorial review. [Story](../content/tutorials/choose-an-order-book.md) · [Practical](../content/tutorials/sketch-order-permissions.md) · [Technical](../content/tutorials/write-the-bakery-spec.md)

On 2026-11-23, `pnpm verify` passed all 112 tests, content validation and the production build. The production smoke test opened all six tutorial readers. At 390 px and 1280 px, Chromium followed the chain from Dream through Blueprint, opened the related cards, verified both copyable blocks, downloaded the starter using the Dream prompt and recorded completion for all three lessons.

The blueprint grid now repeats down the full document, and the footer reaches the bottom of short pages. Chromium checks at 390 px and 1280 px covered the learning path, a tutorial, Cards, Lab, Open, a generated X-Ray result, Privacy and a 404. All 16 captures showed grid lines through the final eight pixels and no horizontal overflow. Before the fix, the learning path lost its grid after the first viewport and the 404 footer left a 33 px gap on mobile and a 177 px gap on desktop. [Before and after screenshots](screenshots/issue-1/)

The founder can start a lesson in Claude Code with `/draft-tutorial` and a teaching brief. The command uses the existing template, saves a draft and runs the content checker. Claude Code 2.1.268 recognised the project command and expanded a sample brief in a local test. A separate template-based draft with a prerequisite and a related card passed `pnpm content:check` in a temporary copy of the library. [Example brief](content-guide.md#writing-a-tutorial-with-claude-code)

The founder approved the three Dream tutorials for the initial chapter on 2026-11-22. Their review status appears on the learning path and each lesson. The bakery exercise now supplies two complete orders, a copyable build prompt with both acceptance checks, and a third order for the learner to try. The scope card includes a test for two-sided products.

The storage card now gives separate checks for a database, a manual inbox or sheet, and a static page. The recovery card checks records on both sides of the chosen recovery point. A local drill restored an embedded Postgres snapshot to a separate instance and verified both the recovered and source records. Hosted point-in-time recovery still requires a provider-specific drill.

The access card now tests both a private order and a deliberately public listing. The credentials card checks server settings, a vault or provider-designated browser keys according to the option selected. All 15 distinct source URLs in the cards, tutorials and product context opened. The founder approved all five cards for the initial release as drafts. Readers can open them from `/cards`.

On 2026-11-22, `pnpm verify` passed type checking, lint, all 112 tests, content validation and the production build. The production journey passed 38 HTTP checks with the rule-based provider on both embedded Postgres and a disposable PostgreSQL 17 server. The PostgreSQL run also checked failure reporting before migration and preserved the signup across a second migration. Chromium checks at 390 px and 1280 px verified the reviewed labels on the learning path and all three readers. Earlier checks covered all eight learning pages, clipboard, completion and signup metrics. The founder chose GitHub delivery for this pass and deferred public deployment.

| Area | What exists | Verified by |
| --- | --- | --- |
| Brand | The founder chose VibeAcademy on 2026-11-23. Pages, share images, generated prompts and starter files use that spelling. The earlier SeniorSeat name remains in historical records and screenshots, browser storage and events, process cache keys, the CI scratch directory and the smoke-test database name. | Chromium checked 12 routes at 390 px and 1280 px, including a shared result. Existing completion, depth and X-Ray state carried over. The production smoke test covers the home link and tutorial share metadata. [Brand decision and availability checks](open-decisions.md#resolved-for-m1) |
| Tutorial format | Markdown with typed YAML frontmatter, shared taxonomy IDs, and HTML escaped in lesson bodies ([ADR 0012](decisions/0012-tutorial-markdown.md)) | Tutorial format tests cover metadata, delimiters, code examples and link handling |
| Learning path and reader | Home and navigation link to `/learn`. All seven chapters appear in order. Dream, Blueprint and First Build have reader pages with contents, prerequisite and Decision Card links, copyable examples, callouts and adjacent lessons. The sitemap and share images cover the reader routes. | Content tests and production smoke checks cover reader pages, missing slugs, sitemap and share images. |
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
| Decision Cards | Schema with the 8 parts, 11 cards (all `draft`), Depth Dial (keyboard accessible, remembered), App Life Path page | Content tests, `pnpm content:check`, browser run |
| Twin Builds Lab | Methodology (11 metrics), episode schema that forbids unpublished numbers, episode 1 planned, fight card that shows "Not measured yet" | Content tests |
| `/open` | Live counts, cache hit rate, AI spend, average cost per paid call, budget cap and waitlist size. First-party events give the rolling 30-day signup pace and signups from the X-Ray link per 100 completed checks. | Integration tests cover duplicates, missing denominators, older unattributed events and the reporting window. The production smoke test reads the metrics on `/open`. |
| Waitlist | Email, tool, experience, consent; no enumeration; rate-limited | Integration tests, smoke test |
| Database readiness | `/api/health` checks that the application role can read all seven application tables without fetching any rows. An inaccessible table makes the endpoint return 503. | Route tests cover a migrated database and a reachable database missing the waitlist table. |
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

M2 has six linked implementation issues. Each includes dependencies, acceptance checks and an access test with two independent learner sessions. The account work awaits the founder’s choice of sign-in methods in ADR 0010. [M2 plan](https://github.com/Shakilkhan24/VibeAcademy/issues/11)

M1 public launch ([roadmap.md](roadmap.md)). Then accounts and authorisation (ADR 0010, proposed), Phase 1 tables (architecture.md), Blueprint, Build Pack v1, progress and ranks, Crash Theater, payments, Reality Check, mentor, agent skill. See [roadmap.md](roadmap.md).

## Deferred on purpose

| Item | Why |
| --- | --- |
| Third-party analytics and session replay | First-party events cover Phase 0 (ADR 0007). |
| Light theme | Tokens are centralised; not needed to validate demand. |
| Nonce-based CSP | Planned for M2; current CSP still blocks third-party scripts, frames and connections. |
| Translations | English first; content schema supports adding locale fields later. |
| AI-assisted X-Ray and AI mentor | Founder decision: no paid API spend for now (ADR 0011). The Anthropic provider is built and tested against mocks, switched off unless `AI_PROVIDER=anthropic`. See roadmap, "Later: AI features". |

## Awaiting founder

See [open-decisions.md](open-decisions.md): launch domain, Google OAuth client, email provider, payments provider and prices, hosting account and publication of the reviewed legal text.

## Known limitations

- The rule-based check is keyword matching: it can miss a decision phrased in unusual words and can credit one that is only mentioned. It is labelled "Rule-based check" everywhere.
- Local development databases created before ADR 0011 may hold rows with `mode = 'simulated'`; delete `.data/pglite` to reset.
- X-Ray and waitlist rate limits each use a shared bucket by default. Enable per-visitor limits with `TRUST_PROXY=on` once the origin accepts traffic only from a proxy that replaces client-supplied IP headers.
- The live HTTP header grade for issue #7 is pending the first public deployment. Run Mozilla HTTP Observatory against the launch HTTPS origin, then record the date, grade and report link here.
- PGlite is development-only and single-process.
- The footer links to the privacy summary and terms page. The privacy page publishes the deletion contact. The founder deferred double opt-in until deployment and chose to keep the current privacy summary and terms placeholder for this milestone. The final wording remains a pre-launch item. [Issue #8](https://github.com/Shakilkhan24/VibeAcademy/issues/8)
