# 0007: First-party analytics in Postgres

**Status:** Accepted (Phase 0)

## Decision
A closed list of events (`xray_completed`, `xray_failed`, `xray_shared`, `xray_unshared`, `xray_deleted`, `waitlist_joined`) with coarse, non-identifying properties, stored in the `events` table. No cookies, no third-party scripts. `/open` reads from the same data.

## Alternatives
PostHog or similar (richer funnels and session replay, but a third-party processor, a cookie banner and a heavier page). Revisit at M3 if funnel analysis needs more than SQL.

## Consequences
The CSP can stay `connect-src 'self'`. Funnel questions are answered with SQL.
