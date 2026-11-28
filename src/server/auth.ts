import "server-only";
import { randomUUID } from "node:crypto";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import type { Db } from "./db/client";
import { accounts, sessions, users, verifications } from "./db/schema";
import type { AppConfig } from "./env";

/**
 * Accounts (ADR 0010): Better Auth inside this app, users and sessions in our Postgres,
 * Google as the only sign-in method. No passwords, no email delivery.
 *
 * Authorisation is not done here: services take the learner's id and filter every
 * learner-owned query by it. This module only answers "who is signed in?".
 */
export function createAuth({ db, config }: { db: Db; config: AppConfig }) {
  return betterAuth({
    appName: "VibeAcademy",
    baseURL: config.siteUrl,
    secret: config.auth.secret,
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: { user: users, session: sessions, account: accounts, verification: verifications },
    }),
    socialProviders: config.auth.google
      ? { google: { clientId: config.auth.google.clientId, clientSecret: config.auth.google.clientSecret, prompt: "select_account" } }
      : {},
    emailAndPassword: { enabled: false },
    account: {
      // We never call Google APIs on the learner's behalf; keep any stored tokens unreadable.
      encryptOAuthTokens: true,
      accountLinking: { enabled: false },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30, // 30 days
      updateAge: 60 * 60 * 24, // refresh the expiry at most once a day
    },
    advanced: {
      database: { generateId: () => randomUUID() },
      // Same rule as the rest of the app: no raw visitor IPs in our tables.
      ipAddress: { disableIpTracking: true },
    },
    telemetry: { enabled: false },
    plugins: [nextCookies()],
  });
}

export type Auth = ReturnType<typeof createAuth>;

export interface Learner {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

/** The signed-in learner for this request, or null. Expired or revoked sessions return null. */
export async function getLearner(auth: Auth, headers: Headers): Promise<Learner | null> {
  const session = await auth.api.getSession({ headers });
  if (!session) return null;
  const { id, name, email, image } = session.user;
  return { id, name, email, image: image ?? null };
}
