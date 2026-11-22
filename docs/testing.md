# Testing and verification

## Layers

| Layer | Location | What it proves | Runs in |
| --- | --- | --- | --- |
| Domain unit tests | `tests/domain/` | Taxonomy integrity, scoring rules and caps, prompt upgrade, AGENTS.md rendering, classification normalisation | Milliseconds |
| Server integration tests | `tests/server/` | Gateway (cache, budget, retry, failures, provider isolation), Anthropic request shape (mocked HTTP), X-Ray service (privacy, limits, kill switch, sharing, deletion), waitlist, config rules, `/open` metrics | Real Postgres via PGlite in memory |
| Route tests | `tests/server/api-routes.test.ts` | Real route handlers: status codes, origin checks, JSON parsing, the full share/delete journey | PGlite |
| Content tests | `tests/content/` | Card and Lab YAML, tutorial frontmatter, safe Markdown and cross-links | File system |
| Smoke test | `scripts/smoke.mjs` | The deployed journey over HTTP: the learning path, X-Ray, sharing, share images, unshare, delete, waitlist, signup reporting and headers | Against a running server |

## Commands

```bash
pnpm test            # all Vitest suites
pnpm verify          # typecheck + lint + tests + content check + build
```

Smoke test against a production build locally:

```bash
pnpm build
NODE_ENV=production HASH_SECRET="$(openssl rand -hex 32)" \
  PGLITE_DATA_DIR=/tmp/seniorseat-smoke pnpm start -p 3000 &
BASE_URL=http://localhost:3000 pnpm smoke
```

Against a deployed environment: `BASE_URL=https://your-domain pnpm smoke` (it creates and then deletes one X-Ray and adds one waitlist entry with a `smoke+...@example.com` address).

## Writing tests

- Services: `createTestContext({ env, provider })` from `tests/support/test-context.ts` gives an isolated in-memory database and a chosen provider. `fakeAnthropic()` behaves like a paid provider (usage, cost) with deterministic answers.
- Any new storage of user data: extend the prompt-leak test in `tests/server/xray-service.test.ts`.
- Any new endpoint that reads user data (Phase 1): test with two users and assert that user A cannot read or change user B's data.
- Classifier quality runs in CI against the labels in `tests/fixtures/prompts/critical-decisions.yaml`. Each prompt has one label per critical decision, before applicability filtering. The minimum overall agreement is 80%. To see the per-decision counts locally, run `pnpm exec vitest run --disableConsoleIntercept tests/server/rules-quality.test.ts`. The result describes these authored fixtures. Real visitor accuracy requires a separate evaluation. If AI analysis is switched on later, the same fixtures measure it, in a test that runs only when `AI_PROVIDER=anthropic` and a key are set.
