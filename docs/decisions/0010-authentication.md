# 0010: Authentication for Phase 1

**Status:** Accepted (2026-11-29). The founder approved Better Auth with Google as the only sign-in method in issue #11. Implemented in M2 (issue #23).

## Context
Phase 1 adds learner accounts, projects and Blueprints. Requirements: email magic link and Google sign-in at minimum; sessions on the server; data in our own Postgres; no passwords handled by us; cheap at small scale; no lock-in to a database vendor.

## Recommendation
**Better Auth** (open source, runs inside the Next.js app, stores users and sessions in our Postgres through Drizzle), with magic links and Google OAuth. Authorisation checks in services by `user_id` (ownership filters), plus tests with two users for every new endpoint: exactly what the "Who can see whose data?" card teaches.

## Alternatives
- **Auth.js:** mature and widely used; a reasonable alternative. Compare the current Drizzle adapter and magic-link support before choosing.
- **Supabase Auth:** good, but pulls the app toward Supabase-specific row-level security and client-side data access.
- **Clerk:** fastest to integrate and polished, but a third party holds every learner identity, and pricing grows with active users.

## Decision

- **Better Auth**, running inside the Next.js app, with users, sessions, OAuth accounts and verification state in our Postgres through the Drizzle adapter (`src/server/auth.ts`, tables `users`, `sessions`, `accounts`, `verifications`).
- **Google is the only sign-in method.** No passwords, no magic links, so no email delivery provider is needed. Email sign-in and other providers are rejected by the handler (tests/server/auth.test.ts).
- Sessions last 30 days and refresh at most once a day. Session cookies are signed with `AUTH_SECRET`, or a key derived from `HASH_SECRET` when it is empty.
- OAuth tokens are stored encrypted (`encryptOAuthTokens`); we never call Google APIs for the learner. IP addresses are not recorded on sessions. Account linking is off.
- Without `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` the site runs signed out and `/sign-in` says sign-in is not set up.
- Authorisation stays in services: every learner-owned query filters by the session's user id, and every new endpoint has a two-user test.

## Consequences

- Production needs a Google OAuth client with the redirect URI `<NEXT_PUBLIC_SITE_URL>/api/auth/callback/google`.
- Learners without a Google account cannot sign in. Everything except saved progress and projects still works for them.
- Adding magic links later means choosing an email provider (open decision 6) and a new ADR.
