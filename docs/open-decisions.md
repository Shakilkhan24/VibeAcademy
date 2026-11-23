# Decisions awaiting the founder

These affect product direction, money, legal exposure or vendors. Agents must not settle them silently. Where work would otherwise block, a provisional choice is noted.

| # | Decision | Why it matters | Provisional choice in the code | Needed by |
| --- | --- | --- | --- | --- |
| 4 | Whether and when to switch on AI features, and the daily budget | Paid API spend | Off: rule-based check only (ADR 0011). `AI_DAILY_BUDGET_USD=2` applies only once switched on | Later (deferred) |
| 5 | Hosting and database vendors | Cost, region, data residency | Recommended: Vercel + Neon (or Supabase Postgres); not provisioned | M1 |
| 6 | Email provider (double opt-in, magic links) | Vendor, deliverability, cost | Founder deferred double opt-in until deployment. Choose a provider then. | Deployment / M2 |
| 7 | Authentication library and sign-in methods | Identity data and lock-in | ADR 0010 proposes Better Auth with magic link + Google | M2 |
| 8 | Merchant of record and prices | Revenue, tax, payouts to the founder's country | None. Plan hypotheses ($9 Builder, $24 Pro) are NOT in the code | M3 |
| 9 | Privacy policy and terms | Legal requirement before collecting accounts or payments | Founder chose the existing `/privacy` summary and `/terms` placeholder for the GitHub milestone. Final wording is deferred until before public launch. | M1 (waitlist) / M2 (accounts) |
| 11 | Lab episode 1 tool and filming | First public proof | Episode YAML says "Lovable or Bolt", status planned | M4 |

## Resolved for M1

- **10. Waitlist deletion contact.** The founder chose `automateanything2@gmail.com`. The privacy page links to this monitored mailbox and the operator procedure verifies control of the signup address.

- **1. Brand.** On 2026-11-23 the founder chose **VibeAcademy**. The repository stays at `Shakilkhan24/VibeAcademy`. The public launch domain and social accounts are still to be selected. [Issue #3](https://github.com/Shakilkhan24/VibeAcademy/issues/3)
  - Registry lookups on that date showed registrations for all four exact-name domains checked. [vibeacademy.com](https://rdap.verisign.com/com/v1/domain/vibeacademy.com) · [vibeacademy.org](https://rdap.publicinterestregistry.org/rdap/domain/vibeacademy.org) · [vibeacademy.dev](https://pubapi.registry.google/rdap/domain/vibeacademy.dev) · [vibeacademy.app](https://pubapi.registry.google/rdap/domain/vibeacademy.app)
  - The exact handle already resolves on GitHub and YouTube. Bluesky returned `HandleNotFound` for `vibeacademy.bsky.social`. Availability at signup is unconfirmed. [GitHub](https://github.com/vibeacademy) · [YouTube](https://www.youtube.com/@VibeAcademy) · [Bluesky handle lookup](https://bsky.social/xrpc/com.atproto.identity.resolveHandle?handle=vibeacademy.bsky.social)
- **2. Decision Cards.** On 2026-11-22 the founder approved including all five current cards in the initial release as drafts. Each card can be marked `reviewed` after a second engineer checks it.
- **3. X-Ray quality.** The founder set an 80% minimum agreement target for the four critical decisions across 20–30 hand-labelled prompts on 2026-11-21. The offline test runs in CI.

- **12. Launch design.** The founder retained the existing blueprint look on 2026-11-21. See the [design brief](design-brief.md).
- **13. Opening tutorials.** The founder delegated topic and depth selection and requested increasing difficulty. The Dream sequence moves from one user's job to a minimal workflow to a testable build prompt. The founder approved the three opening lessons for the initial chapter on 2026-11-22.
