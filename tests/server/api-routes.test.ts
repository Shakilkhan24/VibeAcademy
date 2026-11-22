import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import * as context from "@/server/context";
import { createTestContext } from "../support/test-context";
import { SHOP_PROMPT } from "../support/fixtures";

/**
 * Exercises the real route handlers end to end (request parsing, origin checks, service,
 * embedded database, error mapping) through the process-wide context with the rule-based check.
 */
const ENV = { NODE_ENV: "test", AI_PROVIDER: "rules", PGLITE_DATA_DIR: "memory://", HASH_SECRET: "route-test-secret-123", XRAY_MINUTE_LIMIT: "20", XRAY_DAILY_LIMIT: "50" };
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

function req(method: string, body: unknown, headers: Record<string, string> = {}) {
  return new Request("http://localhost:3000/api", {
    method,
    headers: { "content-type": "application/json", host: "localhost:3000", "x-forwarded-for": "192.0.2.10", ...headers },
    body: JSON.stringify(body),
  });
}

describe("API routes", () => {
  it("runs the full X-Ray journey: analyse, share, view shared, unshare, delete", async () => {
    const xray = await import("@/app/api/xray/route");
    const share = await import("@/app/api/xray/share/route");

    const created = await xray.POST(req("POST", { prompt: SHOP_PROMPT }, { origin: "http://localhost:3000" }));
    expect(created.status).toBe(201);
    expect(created.headers.get("cache-control")).toBe("no-store");
    const result = await created.json();
    expect(result.mode).toBe("rules");
    expect(JSON.stringify(result)).not.toContain("homemade candles");

    const owner = { runId: result.runId, ownerToken: result.ownerToken };
    const shared = await share.POST(req("POST", owner));
    expect(shared.status).toBe(200);
    const { slug } = await shared.json();
    expect(slug).toMatch(/^[a-zA-Z0-9]{10}$/);

    expect((await share.DELETE(req("DELETE", owner))).status).toBe(200);
    expect((await xray.DELETE(req("DELETE", owner))).status).toBe(200);
    expect((await xray.DELETE(req("DELETE", owner))).status).toBe(404);
  });

  it("rejects cross-site requests", async () => {
    const xray = await import("@/app/api/xray/route");
    const res = await xray.POST(req("POST", { prompt: SHOP_PROMPT }, { origin: "https://evil.example" }));
    expect(res.status).toBe(403);
    expect((await res.json()).error.code).toBe("forbidden");
  });

  it("rejects non-JSON and invalid input with clear messages", async () => {
    const xray = await import("@/app/api/xray/route");
    const notJson = new Request("http://localhost:3000/api", { method: "POST", headers: { "content-type": "text/plain", host: "localhost:3000" }, body: "hi" });
    expect((await xray.POST(notJson)).status).toBe(400);
    const short = await xray.POST(req("POST", { prompt: "hi" }));
    expect(short.status).toBe(400);
    expect((await short.json()).error.message).toMatch(/at least 20 characters/);
  });

  it("accepts a waitlist sign-up", async () => {
    const waitlist = await import("@/app/api/waitlist/route");
    const res = await waitlist.POST(req("POST", { email: "route@example.com", consent: true }));
    expect(res.status).toBe(201);
  });

  it("reports health", async () => {
    const health = await import("@/app/api/health/route");
    const res = await health.GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, database: "up", analysis: "rules" });
  });

  it("returns 503 if a required table is missing from a reachable database", async () => {
    const health = await import("@/app/api/health/route");
    const isolated = await createTestContext();
    await isolated.db.execute(sql`alter table waitlist_entries rename to pending_migration`);
    const getContext = vi.spyOn(context, "getAppContext").mockResolvedValueOnce(isolated);
    try {
      const res = await health.GET();
      expect(res.status).toBe(503);
      expect(await res.json()).toEqual({ ok: false, database: "down" });
    } finally {
      getContext.mockRestore();
    }
  });
});
