# 0010: Authentication for Phase 1

**Status:** Proposed, awaiting founder approval (not needed for Phase 0, which has no accounts)

## Context
Phase 1 adds learner accounts, projects and Blueprints. Requirements: email magic link and Google sign-in at minimum; sessions on the server; data in our own Postgres; no passwords handled by us; cheap at small scale; no lock-in to a database vendor.

## Recommendation
**Better Auth** (open source, runs inside the Next.js app, stores users and sessions in our Postgres through Drizzle), with magic links and Google OAuth. Authorisation checks in services by `user_id` (ownership filters), plus tests with two users for every new endpoint: exactly what the "Who can see whose data?" card teaches.

## Alternatives
- **Auth.js:** mature and widely used; a reasonable alternative. Compare the current Drizzle adapter and magic-link support before choosing.
- **Supabase Auth:** good, but pulls the app toward Supabase-specific row-level security and client-side data access.
- **Clerk:** fastest to integrate and polished, but a third party holds every learner identity, and pricing grows with active users.

## Needs from the founder
Approve the library choice and the sign-in methods. Magic links also need an email provider (Resend, Postmark or similar), a financial and vendor decision.
