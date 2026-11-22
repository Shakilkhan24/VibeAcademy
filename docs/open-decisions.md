# Decisions awaiting the founder

These affect product direction, money, legal exposure or vendors. Agents must not settle them silently. Where work would otherwise block, a provisional choice is noted.

| # | Decision | Why it matters | Provisional choice in the code | Needed by |
| --- | --- | --- | --- | --- |
| 1 | Final brand name (SeniorSeat is provisional) | Domain, trademark, social handles, share images | "SeniorSeat" everywhere; name lives in a handful of components and metadata | Before public launch (M1) |
| 2 | Review of the five Decision Cards | Credibility rests on expert-checked content | All five are `status: draft` and labelled "Draft" in the UI | M1 |
| 4 | Whether and when to switch on AI features, and the daily budget | Paid API spend | Off: rule-based check only (ADR 0011). `AI_DAILY_BUDGET_USD=2` applies only once switched on | Later (deferred) |
| 5 | Hosting and database vendors | Cost, region, data residency | Recommended: Vercel + Neon (or Supabase Postgres); not provisioned | M1 |
| 6 | Email provider (double opt-in, magic links) | Vendor, deliverability, cost | None; waitlist stores consented emails without confirmation | M1/M2 |
| 7 | Authentication library and sign-in methods | Identity data and lock-in | ADR 0010 proposes Better Auth with magic link + Google | M2 |
| 8 | Merchant of record and prices | Revenue, tax, payouts to the founder's country | None. Plan hypotheses ($9 Builder, $24 Pro) are NOT in the code | M3 |
| 9 | Privacy policy and terms | Legal requirement before collecting accounts or payments | Plain-language `/privacy` page reflecting actual behaviour | M1 (waitlist) / M2 (accounts) |
| 10 | Contact address for deletion requests | Waitlist deletion before self-service exists | `/privacy` says it will be given in the launch announcement | M1 |
| 11 | Lab episode 1 tool and filming | First public proof | Episode YAML says "Lovable or Bolt", status planned | M4 |

## Resolved for M1

- **3. X-Ray quality.** The founder set an 80% minimum agreement target for the four critical decisions across 20–30 hand-labelled prompts on 2026-11-21. The offline test runs in CI.

- **12. Launch design.** The founder retained the existing blueprint look on 2026-11-21. See the [design brief](design-brief.md).
- **13. Opening tutorials.** The founder delegated topic and depth selection and requested increasing difficulty. The Dream sequence moves from one user's job to a minimal workflow to a testable build prompt. The founder approved the three opening lessons for the initial chapter on 2026-11-22.
