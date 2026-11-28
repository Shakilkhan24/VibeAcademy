import { afterEach, describe, expect, it, vi } from "vitest";
import { SignJWT, exportJWK, generateKeyPair } from "jose";
import { eq } from "drizzle-orm";
import { getLearner } from "@/server/auth";
import { accounts, sessions, users, waitlistEntries, xrayRuns } from "@/server/db/schema";
import { getAccount, updateAccount } from "@/server/services/account";
import { runXRay } from "@/server/services/xray";
import { joinWaitlist } from "@/server/services/waitlist";
import { createTestContext } from "../support/test-context";
import { headersFor, signInAs } from "../support/auth";
import { SHOP_PROMPT } from "../support/fixtures";

const SITE = "http://localhost:3000";
const CLIENT_ID = "test-client.apps.googleusercontent.com";
const googleEnv = { GOOGLE_CLIENT_ID: CLIENT_ID, GOOGLE_CLIENT_SECRET: "test-google-secret", NEXT_PUBLIC_SITE_URL: SITE };

/** Cookies from Set-Cookie headers, as a browser would send them back. */
function cookieJar(res: Response, jar = new Map<string, string>()) {
  for (const line of res.headers.getSetCookie()) {
    const [pair] = line.split(";");
    const at = pair!.indexOf("=");
    const name = pair!.slice(0, at);
    const value = pair!.slice(at + 1);
    if (/max-age=0/i.test(line) || value === "") jar.delete(name);
    else jar.set(name, value);
  }
  return jar;
}
const cookieHeader = (jar: Map<string, string>) => [...jar].map(([k, v]) => `${k}=${v}`).join("; ");

/**
 * A stand-in for Google: answers the token endpoint with an RS256 ID token signed by a key
 * we publish on the JWKS endpoint, so Better Auth's real verification code runs.
 */
async function fakeGoogle(profile: { sub: string; email: string; name: string }) {
  const { publicKey, privateKey } = await generateKeyPair("RS256");
  const jwk = { ...(await exportJWK(publicKey)), kid: "test-key", alg: "RS256", use: "sig" };
  const realFetch = globalThis.fetch;
  const seen: string[] = [];
  vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    seen.push(url);
    if (url.startsWith("https://oauth2.googleapis.com/token")) {
      const idToken = await new SignJWT({ email: profile.email, email_verified: true, name: profile.name, picture: "https://example.com/p.png" })
        .setProtectedHeader({ alg: "RS256", kid: "test-key" })
        .setIssuer("https://accounts.google.com").setAudience(CLIENT_ID).setSubject(profile.sub)
        .setIssuedAt().setExpirationTime("10m").sign(privateKey);
      return Response.json({ access_token: "google-access", expires_in: 3600, token_type: "Bearer", scope: "openid email profile", id_token: idToken });
    }
    if (url.startsWith("https://www.googleapis.com/oauth2/v3/certs")) return Response.json({ keys: [jwk] });
    return realFetch(input, init);
  });
  return seen;
}

afterEach(() => vi.unstubAllGlobals());

describe("Google sign-in (Better Auth)", () => {
  it("signs in with Google only, creates a session, and signs out", async () => {
    const ctx = await createTestContext({ env: googleEnv });
    const seen = await fakeGoogle({ sub: "google-sub-1", email: "maya@example.com", name: "Maya" });

    const start = await ctx.auth.handler(new Request(`${SITE}/api/auth/sign-in/social`, {
      method: "POST", headers: { "content-type": "application/json", origin: SITE },
      body: JSON.stringify({ provider: "google", callbackURL: "/projects" }),
    }));
    expect(start.status).toBe(200);
    const { url } = (await start.json()) as { url: string };
    const google = new URL(url);
    expect(google.origin).toBe("https://accounts.google.com");
    expect(google.searchParams.get("client_id")).toBe(CLIENT_ID);
    expect(google.searchParams.get("redirect_uri")).toBe(`${SITE}/api/auth/callback/google`);
    const jar = cookieJar(start);

    const callback = await ctx.auth.handler(new Request(
      `${SITE}/api/auth/callback/google?code=one-time-code&state=${google.searchParams.get("state")}`,
      { headers: { cookie: cookieHeader(jar) } },
    ));
    expect(callback.status).toBe(302);
    expect(callback.headers.get("location")).toBe("/projects");
    expect(seen.some((u) => u.startsWith("https://oauth2.googleapis.com/token"))).toBe(true);
    cookieJar(callback, jar);

    const signedIn = new Headers({ cookie: cookieHeader(jar) });
    const learner = await getLearner(ctx.auth, signedIn);
    expect(learner).toMatchObject({ email: "maya@example.com", name: "Maya" });

    // Tokens are stored encrypted, and no IP address is recorded.
    const [account] = await ctx.db.select().from(accounts).where(eq(accounts.userId, learner!.id));
    expect(account?.providerId).toBe("google");
    expect(account?.accessToken).not.toBe("google-access");
    expect(account?.password).toBeNull();
    const [session] = await ctx.db.select().from(sessions).where(eq(sessions.userId, learner!.id));
    expect(session?.ipAddress || null).toBeNull();

    const out = await ctx.auth.handler(new Request(`${SITE}/api/auth/sign-out`, { method: "POST", headers: { cookie: cookieHeader(jar), origin: SITE } }));
    expect(out.status).toBe(200);
    expect(await getLearner(ctx.auth, signedIn)).toBeNull();
  });

  it("offers no other sign-in method", async () => {
    const ctx = await createTestContext({ env: googleEnv });
    for (const provider of ["github", "apple"]) {
      const res = await ctx.auth.handler(new Request(`${SITE}/api/auth/sign-in/social`, {
        method: "POST", headers: { "content-type": "application/json", origin: SITE }, body: JSON.stringify({ provider }),
      }));
      expect(res.status).toBeGreaterThanOrEqual(400);
    }
    const email = await ctx.auth.handler(new Request(`${SITE}/api/auth/sign-in/email`, {
      method: "POST", headers: { "content-type": "application/json", origin: SITE }, body: JSON.stringify({ email: "a@example.com", password: "password-1234" }),
    }));
    expect(email.status).toBeGreaterThanOrEqual(400);
  });

  it("works signed out when Google is not configured", async () => {
    const ctx = await createTestContext();
    expect(ctx.config.auth.google).toBeNull();
    expect(await getLearner(ctx.auth, new Headers())).toBeNull();
  });

  it("treats an expired session as signed out", async () => {
    const ctx = await createTestContext();
    const live = await signInAs(ctx, { email: "live@example.com" });
    expect(await getLearner(ctx.auth, live.headers)).not.toBeNull();
    const expired = await signInAs(ctx, { email: "old@example.com" }, { expiresAt: new Date(Date.now() - 60_000) });
    expect(await getLearner(ctx.auth, expired.headers)).toBeNull();
  });

  it("rejects a tampered session cookie", async () => {
    const ctx = await createTestContext();
    const a = await signInAs(ctx, { email: "a@example.com" });
    const forged = new Headers({ cookie: `better-auth.session_token=${encodeURIComponent(`${a.token}.AAAA`)}` });
    expect(await getLearner(ctx.auth, forged)).toBeNull();
  });
});

describe("two-user access: accounts", () => {
  it("each learner reads and updates only their own account; signing out A keeps B signed in", async () => {
    const ctx = await createTestContext({ env: { NEXT_PUBLIC_SITE_URL: SITE } });
    const a = await signInAs(ctx, { email: "a@example.com", name: "Ada" });
    const b = await signInAs(ctx, { email: "b@example.com", name: "Bo" });
    const learnerA = (await getLearner(ctx.auth, a.headers))!;
    const learnerB = (await getLearner(ctx.auth, b.headers))!;

    expect((await getAccount(ctx, learnerA)).email).toBe("a@example.com");
    expect((await getAccount(ctx, learnerB)).email).toBe("b@example.com");

    // B's update can only target B: the API has no way to name another learner.
    await updateAccount(ctx, learnerB, { name: "Bo B." });
    await expect(updateAccount(ctx, learnerB, { name: "Hacked", id: learnerA.id })).rejects.toMatchObject({ code: "invalid_input" });
    expect((await getAccount(ctx, learnerA)).name).toBe("Ada");
    expect((await getAccount(ctx, learnerB)).name).toBe("Bo B.");

    await ctx.auth.api.signOut({ headers: headersFor(ctx, a.token) });
    expect(await getLearner(ctx.auth, a.headers)).toBeNull();
    expect((await getLearner(ctx.auth, b.headers))?.id).toBe(learnerB.id);
  });
});

describe("M1 data survives the M2 migration", () => {
  it("keeps anonymous X-Ray and waitlist flows working alongside accounts", async () => {
    const ctx = await createTestContext();
    await joinWaitlist(ctx, { body: { email: "early@example.com", consent: true }, clientIp: "1.1.1.1" });
    const run = await runXRay(ctx, { prompt: SHOP_PROMPT, clientIp: "1.1.1.1" });
    const [row] = await ctx.db.select({ userId: xrayRuns.userId }).from(xrayRuns).where(eq(xrayRuns.id, run.runId));
    expect(row?.userId).toBeNull();
    expect(await ctx.db.select().from(waitlistEntries)).toHaveLength(1);
    expect(await ctx.db.select().from(users)).toHaveLength(0);
  });
});
