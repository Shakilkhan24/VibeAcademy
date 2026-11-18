# Decisions awaiting the founder

These affect product direction, money, legal exposure or vendors. Agents must not settle them silently. Where work would otherwise block, a provisional choice is noted.

| # | Decision | Why it matters | Provisional choice in the code | Needed by |
| --- | --- | --- | --- | --- |
| 1 | Final brand name (SeniorSeat is provisional) | Domain, trademark, social handles, share images | "SeniorSeat" everywhere; name lives in a handful of components and metadata | Before public launch (M1) |
| 2 | Review of the five Decision Cards | Credibility rests on expert-checked content | All five are `status: draft` and labelled "Draft" in the UI | M1 |
| 3 | Classifier quality bar | Defines when the X-Ray is good enough to promote | Suggested: 90% agreement on critical decisions over a labelled set | M1 |
| 4 | Daily AI budget | Caps spend from abuse or virality | `AI_DAILY_BUDGET_USD=2` (env) | M1 deploy |
| 5 | Hosting and database vendors | Cost, region, data residency | Recommended: Vercel + Neon (or Supabase Postgres); not provisioned | M1 |
| 6 | Email provider (double opt-in, magic links) | Vendor, deliverability, cost | None; waitlist stores consented emails without confirmation | M1/M2 |
| 7 | Authentication library and sign-in methods | Identity data and lock-in | ADR 0010 proposes Better Auth with magic link + Google | M2 |
| 8 | Merchant of record and prices | Revenue, tax, payouts to the founder's country | None. Plan hypotheses ($9 Builder, $24 Pro) are NOT in the code | M3 |
| 9 | Privacy policy and terms | Legal requirement before collecting accounts or payments | Plain-language `/privacy` page reflecting actual behaviour | M1 (waitlist) / M2 (accounts) |
| 10 | Contact address for deletion requests | Waitlist deletion before self-service exists | `/privacy` says it will be given in the launch announcement | M1 |
| 11 | Lab episode 1 tool and filming | First public proof | Episode YAML says "Lovable or Bolt", status planned | M4 |
