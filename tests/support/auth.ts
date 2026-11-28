import { createHmac } from "node:crypto";
import type { AppContext } from "@/server/context";

/**
 * Creates a learner and a live session directly through Better Auth's own adapter, then
 * returns request headers carrying the signed session cookie, exactly as a browser would.
 * The full Google redirect flow is exercised separately in tests/server/auth.test.ts.
 */
export async function signInAs(ctx: AppContext, who: { email: string; name?: string }, opts: { expiresAt?: Date } = {}) {
  const auth = await ctx.auth.$context;
  const user = await auth.internalAdapter.createUser({ email: who.email, name: who.name ?? who.email.split("@")[0]!, emailVerified: true }, { method: "admin" });
  const session = await auth.internalAdapter.createSession(user.id, false);
  if (opts.expiresAt) await auth.internalAdapter.updateSession(session.token, { expiresAt: opts.expiresAt });
  return { user, token: session.token, headers: headersFor(ctx, session.token) };
}

/** Signs a session token the way better-call does: `${token}.${base64(HMAC-SHA256)}`, URI-encoded. */
export function headersFor(ctx: AppContext, token: string, extra: Record<string, string> = {}) {
  const signature = createHmac("sha256", ctx.config.auth.secret).update(token).digest("base64");
  return new Headers({ cookie: `better-auth.session_token=${encodeURIComponent(`${token}.${signature}`)}`, ...extra });
}
