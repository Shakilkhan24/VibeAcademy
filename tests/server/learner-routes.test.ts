import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getAppContext } from "@/server/context";
import { signInAs } from "../support/auth";

/**
 * Signed-in route handlers, exercised with two real sessions (learner A and learner B)
 * through the process-wide context. Every new learner endpoint gets a case here.
 */
const ENV = { NODE_ENV: "test", PGLITE_DATA_DIR: "memory://", HASH_SECRET: "learner-route-secret-123", NEXT_PUBLIC_SITE_URL: "http://localhost:3000" };
const saved: Record<string, string | undefined> = {};
beforeAll(() => {
  for (const [k, v] of Object.entries(ENV)) {
    saved[k] = process.env[k];
    process.env[k] = v;
  }
});
afterAll(() => {
  for (const [k, v] of Object.entries(saved)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
});

function call(method: string, path: string, headers?: Headers, body?: unknown) {
  const h = new Headers(headers);
  h.set("host", "localhost:3000");
  if (body !== undefined) h.set("content-type", "application/json");
  return new Request(`http://localhost:3000${path}`, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) });
}

async function twoLearners() {
  const ctx = await getAppContext();
  const n = Math.random().toString(36).slice(2, 8);
  const a = await signInAs(ctx, { email: `a-${n}@example.com`, name: "Ada" });
  const b = await signInAs(ctx, { email: `b-${n}@example.com`, name: "Bo" });
  return { ctx, a, b };
}

describe("account routes", () => {
  it("requires a session", async () => {
    const route = await import("@/app/api/account/route");
    const res = await route.GET(call("GET", "/api/account"));
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ error: { code: "unauthenticated" } });
  });

  it("returns and updates only the caller's own account", async () => {
    const route = await import("@/app/api/account/route");
    const { a, b } = await twoLearners();
    expect(await (await route.GET(call("GET", "/api/account", a.headers))).json()).toMatchObject({ id: a.user.id, name: "Ada" });
    expect(await (await route.GET(call("GET", "/api/account", b.headers))).json()).toMatchObject({ id: b.user.id, name: "Bo" });

    const denied = await route.PATCH(call("PATCH", "/api/account", b.headers, { id: a.user.id, name: "Not Ada" }));
    expect(denied.status).toBe(400);
    const ok = await route.PATCH(call("PATCH", "/api/account", b.headers, { name: "Bo B." }));
    expect(ok.status).toBe(200);
    expect(await (await route.GET(call("GET", "/api/account", a.headers))).json()).toMatchObject({ name: "Ada" });
  });

  it("rejects cross-site updates", async () => {
    const route = await import("@/app/api/account/route");
    const { a } = await twoLearners();
    const h = new Headers(a.headers);
    h.set("origin", "https://evil.example");
    expect((await route.PATCH(call("PATCH", "/api/account", h, { name: "x" }))).status).toBe(403);
  });
});

describe("progress routes", () => {
  it("require a session", async () => {
    const progress = await import("@/app/api/progress/route");
    const imp = await import("@/app/api/progress/import/route");
    expect((await progress.GET(call("GET", "/api/progress"))).status).toBe(401);
    expect((await progress.POST(call("POST", "/api/progress", undefined, { slug: "choose-one-job", done: true }))).status).toBe(401);
    expect((await imp.POST(call("POST", "/api/progress/import", undefined, { slugs: ["choose-one-job"] }))).status).toBe(401);
  });

  it("import, read on a second device, and stay separate between learners", async () => {
    const progress = await import("@/app/api/progress/route");
    const imp = await import("@/app/api/progress/import/route");
    const { ctx, a, b } = await twoLearners();
    const first = await imp.POST(call("POST", "/api/progress/import", a.headers, { slugs: ["choose-one-job", "sketch-the-first-workflow"] }));
    expect(await first.json()).toMatchObject({ imported: 2 });
    const repeat = await imp.POST(call("POST", "/api/progress/import", a.headers, { slugs: ["choose-one-job"] }));
    expect(await repeat.json()).toMatchObject({ imported: 0 });

    // A's second device: a new session for the same learner.
    const device2 = (await ctx.auth.$context).internalAdapter;
    const session2 = await device2.createSession(a.user.id, false);
    const { headersFor } = await import("../support/auth");
    const onSecondDevice = await (await progress.GET(call("GET", "/api/progress", headersFor(ctx, session2.token)))).json();
    expect(onSecondDevice.completed.sort()).toEqual(["choose-one-job", "sketch-the-first-workflow"]);

    expect(await (await progress.GET(call("GET", "/api/progress", b.headers))).json()).toEqual({ completed: [] });
    await progress.POST(call("POST", "/api/progress", b.headers, { slug: "choose-one-job", done: false }));
    expect((await (await progress.GET(call("GET", "/api/progress", a.headers))).json()).completed).toHaveLength(2);
  });
});
