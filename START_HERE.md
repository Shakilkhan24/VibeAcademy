# START HERE

You are continuing **SeniorSeat**, a platform that teaches vibe coders to make the engineering decisions a senior engineer makes, while AI does the typing. This file is the entry point for any person or AI agent picking up the project. Read it fully before changing anything.

*Tagline:* Vibe like a beginner. Decide like a senior.
*Core idea:* every vague prompt silently hands dozens of engineering decisions to the AI. SeniorSeat reveals them (Prompt X-Ray), teaches them (Decision Cards at five depths), turns them into a spec (Blueprint and Build Pack) and proves the difference (Twin Builds Lab, Reality Check).

## 1. Where the project stands

**Phase 0 (validate the concept) is implemented and verified.** Exact state, feature by feature: [docs/status.md](docs/status.md).

Working now:

- Landing page, Prompt X-Ray with results, shareable results (no prompt ever shown), share image, waitlist, Twin Builds Lab foundation, `/open` transparency page, privacy page.
- One controlled AI pathway (`src/server/ai/gateway.ts`) with provider abstraction, structured outputs, caching, daily budget, usage ledger, retries, timeouts and kill switches.
- Deterministic, versioned scoring of 36 decisions across 12 domains (`src/domain/xray/`).
- Five Decision Cards (drafts awaiting your review) with the Depth Dial, validated by schema.
- 77 unit and integration tests, a 27-check smoke test, lint and a production build, all passing (details in [GENERATION_REPORT.md](GENERATION_REPORT.md)).

Not done yet: real AI calls have never run (no API key in the generation environment), the Lab has no measured results, and Phase 1 (accounts, Blueprint, learning path) is designed but not built.

## 2. Run it

```bash
pnpm install            # Node 22+, pnpm 10
cp .env.example .env.local   # optional: everything has a development default
pnpm dev                # http://localhost:3000
```

With no `ANTHROPIC_API_KEY`, the X-Ray runs in a **clearly labelled simulated mode** (keyword rules, not AI). Add a key to `.env.local` to use real analysis. The database is an embedded PGlite (real Postgres in WASM) in `.data/pglite`; nothing to install.

## 3. Verify any change

```bash
pnpm verify             # typecheck + lint + tests + content check + production build
pnpm build && pnpm start &   # then, in another shell:
BASE_URL=http://localhost:3000 pnpm smoke   # needs NODE_ENV=production env, see docs/testing.md
```

Never report something as working because the code exists. Run it.

## 4. How the code is organised

```
src/domain/     Pure logic: taxonomy, scoring, prompt upgrade, Build Pack, content schemas. No I/O.
src/server/     Server only: env config, database, AI gateway and providers, services, security.
src/content/    Loaders for /content YAML (validated on load).
src/components/ UI: design system (ui/), layout, X-Ray, cards, lab, waitlist. Never imports server code.
src/app/        Routes and API handlers: the only place server and UI meet.
content/        Decision Cards and Lab content as YAML, versioned and reviewed in Git.
drizzle/        SQL migrations generated from src/server/db/schema.ts.
tests/          Vitest: domain, server (against real embedded Postgres), content, API routes.
lab/            Twin Builds test harness (k6, ZAP, Lighthouse, secret scan). Not yet run.
docs/           Product, architecture, decisions (ADRs), roadmap, status, design, content, privacy, testing.
```

ESLint enforces these boundaries. Full picture: [docs/architecture.md](docs/architecture.md).

## 5. Established decisions (do not redesign without a new ADR)

| Decision | Where |
| --- | --- |
| Product-defining concepts: 12 domains, 5 depths, 7 chapters, 8-part Decision Card | [docs/product.md](docs/product.md) |
| One Next.js app with enforced internal boundaries, not a monorepo | [ADR 0001](docs/decisions/0001-single-app.md) |
| AI classifies; deterministic code scores | [ADR 0002](docs/decisions/0002-deterministic-scoring.md) |
| One Postgres schema: PGlite in dev and tests, real Postgres in production | [ADR 0003](docs/decisions/0003-database.md) |
| Single AI gateway; providers and features are separate seams | [ADR 0004](docs/decisions/0004-ai-gateway.md) |
| Raw prompts are never stored, logged or returned | [ADR 0005](docs/decisions/0005-prompt-privacy.md) |
| Rate limits and analytics in Postgres, no extra infrastructure | [ADR 0006](docs/decisions/0006-rate-limits.md), [ADR 0007](docs/decisions/0007-analytics.md) |
| Content as YAML in Git, validated by Zod, versioned per card | [ADR 0008](docs/decisions/0008-content-as-yaml.md) |
| Cyanotype blueprint design language | [ADR 0009](docs/decisions/0009-design-language.md), [docs/design-system.md](docs/design-system.md) |

All ADRs: [docs/decisions/README.md](docs/decisions/README.md).

## 6. What to do next

**Next milestone: M1, "Real analysis, ready for the first public visitors".** See [docs/roadmap.md](docs/roadmap.md). In short:

1. Run the X-Ray against the real Anthropic API with a test key; tune the classifier prompt on a set of real prompts and add them as regression fixtures.
2. Deploy (Vercel or similar + Neon/Supabase Postgres), run `pnpm db:migrate`, set production env vars.
3. Get the five draft cards reviewed and marked `reviewed`.
4. Add error tracking and uptime monitoring so `/open` can report them.

Decisions that need the founder before or during M1 are listed in [docs/open-decisions.md](docs/open-decisions.md). Do not silently decide them.

## 7. Rules that must never be broken

1. Never store, log or return raw prompt text. A test enforces this; keep it passing.
2. Never present simulated analysis as AI analysis. The `mode` field and its labels exist everywhere a result appears.
3. Never call a model outside `src/server/ai/gateway.ts`.
4. Never publish a Lab number that is not a measured, published result with raw artifacts. The schema enforces this.
5. Reality Check (future) must verify site ownership and stay passive.
6. Never invent prices, metrics or evidence in the UI or docs. Mark hypotheses as hypotheses.

## 8. How to work here

Read [AGENTS.md](AGENTS.md) for the working agreement. Understand before changing, change in small verified steps, and update `docs/status.md` (and an ADR when architecture changes) in the same change.
