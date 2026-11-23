# START HERE

You are continuing **VibeAcademy**, a platform that teaches vibe coders to make the engineering decisions a senior engineer makes, while AI does the typing. This file is the entry point for any person or AI agent picking up the project. Read it fully before changing anything.

*Tagline:* Vibe like a beginner. Decide like a senior.
*Core idea:* every vague prompt silently hands dozens of engineering decisions to the AI. VibeAcademy reveals them (Prompt X-Ray), teaches them (tutorials and Decision Cards at five depths), turns them into a spec (Blueprint and Build Pack) and proves the difference (Twin Builds Lab, Reality Check).

*Current direction:* a **tutorials-first website**. Nothing in the product calls a paid AI API. The founder writes tutorials and Lab comparisons offline with Claude Code, and the Prompt X-Ray runs on a rule-based check ([ADR 0011](docs/decisions/0011-rules-first-ai-deferred.md)).

## 1. Where the project stands

**The Phase 0 foundation and M1 tutorial implementation are verified on GitHub.** See the [current status](docs/status.md) for checks and outstanding launch work.

Working now:

- Landing page, Prompt X-Ray with results, shareable results (no prompt ever shown), share image, waitlist, Twin Builds Lab foundation, `/open` transparency page, privacy page.
- One controlled analysis pathway (`src/server/ai/gateway.ts`). The rule-based check is the default engine; an Anthropic provider with caching, a daily budget and a usage ledger is built but switched off as a deferred placeholder.
- Deterministic, versioned scoring of 36 decisions across 12 domains (`src/domain/xray/`).
- Six Decision Cards at `/cards`, each with a Depth Dial and a Draft label. The sixth covers payment confirmation.
- A seven-chapter learning path at `/learn`, three reviewed Dream lessons, three draft Blueprint lessons and three reviewed First Build lessons with related cards and share images, browser-local completion, and a Markdown authoring template.
- Offline critical-decision evaluation against 24 labelled prompts. The CI threshold is 80%.
- Type checks, lint, unit and integration tests, content validation, a production build and HTTP smoke checks. See the [verification record](docs/status.md).

The founder approved the Dream tutorials. Hosting, production Postgres and monitoring are deferred at the founder's request. The Lab awaits measured results, accounts and Blueprint are planned for Phase 1, and paid AI remains deferred.

## 2. Run it

```bash
pnpm install            # Node 22+, pnpm 10
cp .env.example .env.local   # optional: everything has a development default
pnpm dev                # http://localhost:3000
```

No API key is needed. The X-Ray uses the **rule-based check** (keyword rules, labelled as such on every result) in development and production. The database is an embedded PGlite (real Postgres in WASM) in `.data/pglite`; nothing to install.

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
src/content/    Validated loaders for cards, Lab YAML and Markdown tutorials.
src/components/ UI: design system (ui/), layout, learning path, X-Ray, cards, lab, waitlist. Never imports server code.
src/app/        Routes and API handlers: the only place server and UI meet.
content/        Decision Cards and Lab content as YAML, tutorials as Markdown with YAML frontmatter.
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
| Validated YAML for cards and Lab content, Markdown with frontmatter for tutorials | [ADR 0008](docs/decisions/0008-content-as-yaml.md), [ADR 0012](docs/decisions/0012-tutorial-markdown.md) |
| Cyanotype blueprint design language (until the founder's design brief replaces it) | [ADR 0009](docs/decisions/0009-design-language.md), [docs/design-system.md](docs/design-system.md), [docs/design-brief.md](docs/design-brief.md) |
| Rule-based X-Ray by default; paid AI deferred | [ADR 0011](docs/decisions/0011-rules-first-ai-deferred.md) |

All ADRs: [docs/decisions/README.md](docs/decisions/README.md).

## 6. What to do next

**Public launch is deferred.** The founder approved the blueprint design, an easy-to-harder Dream curriculum and an 80% X-Ray agreement target. The implementation and verification records are on GitHub.

When the founder resumes public launch, confirm the domain, hosting and Postgres providers, privacy text and deletion contact. Then run the production migrations, configure monitoring and verify the public URL. See the [roadmap](docs/roadmap.md) and [open decisions](docs/open-decisions.md).

**Handing this to a coding agent:** paste-ready prompts for each kind of session (orientation, design pass, the next roadmap step, drafting a tutorial, producing a Lab comparison) are in [docs/agent-prompts.md](docs/agent-prompts.md).

Decisions that need the founder (vendors, prices, and whether to switch on paid AI) are listed in [docs/open-decisions.md](docs/open-decisions.md). Do not silently decide them.

## 7. Rules that must never be broken

1. Never store, log or return raw prompt text. A test enforces this; keep it passing.
2. Never present a rule-based result as AI analysis. The `mode` field and the "Rule-based check" label exist everywhere a result appears. Do not switch on paid AI (`AI_PROVIDER=anthropic`) without the founder.
3. Never call a model outside `src/server/ai/gateway.ts`.
4. Never publish a Lab number that is not a measured, published result with raw artifacts. The schema enforces this.
5. Reality Check (future) must verify site ownership and stay passive.
6. Never invent prices, metrics or evidence in the UI or docs. Mark hypotheses as hypotheses.

## 8. How to work here

Read [AGENTS.md](AGENTS.md) for the working agreement. Understand before changing, change in small verified steps, and update `docs/status.md` (and an ADR when architecture changes) in the same change.
