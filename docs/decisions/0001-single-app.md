# 0001: One Next.js app with enforced internal boundaries

**Status:** Accepted (Phase 0)

## Context
The plan proposed a monorepo-style layout (`apps/web`, `apps/worker`, `packages/ai`, `packages/db`, `packages/scoring`). Phase 0 has one deployable, one developer, and no background worker yet.

## Decision
A single Next.js 16 app. Responsibilities are separated by folders (`src/domain`, `src/server`, `src/content`, `src/components`, `src/app`) and the boundaries are enforced by ESLint `no-restricted-imports` and the `server-only` package, not by package boundaries.

## Alternatives
- **pnpm workspace monorepo:** real package boundaries, but more config, slower installs, harder for agents to navigate, and no second consumer of the packages yet.
- **Separate API service:** unnecessary network hop and deployment for Phase 0 volumes.

## Consequences
- One build, one deploy, one test runner.
- If a worker is needed (Reality Check scans, Phase 2), add `worker/` as a second entry point that imports `src/domain` and `src/server`. Convert to workspaces only if a second deployable needs independent versioning.
