import "server-only";
import { NextResponse } from "next/server";
import { ServiceError } from "./services/errors";

const NO_STORE = { "Cache-Control": "no-store" };
export const MAX_JSON_BYTES = 16 * 1024;

export function json(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return NextResponse.json(data, { status, headers: { ...NO_STORE, ...headers } });
}

export function errorJson(error: unknown) {
  if (error instanceof ServiceError) {
    const headers: Record<string, string> = error.retryAfterSeconds ? { "Retry-After": String(error.retryAfterSeconds) } : {};
    return json({ error: { code: error.code, message: error.message } }, error.status, headers);
  }
  // Unknown errors: log a message (never request bodies), answer generically.
  console.error("[api] unexpected error:", error instanceof Error ? error.message : error);
  return json({ error: { code: "internal", message: "Something went wrong on our side. Try again in a minute." } }, 500);
}

/**
 * The visitor's IP, for rate limiting only (it is HMAC'd before use, never stored raw).
 * Assumes deployment behind a proxy that sets x-forwarded-for (Vercel, Cloudflare, most PaaS).
 */
export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Cross-site request protection for state-changing endpoints. Browsers always send Origin on
 * cross-origin POST/DELETE; when present it must match this site. Requests without Origin
 * (curl, server-to-server) carry no ambient browser credentials and are allowed.
 */
export function assertSameOrigin(req: Request): void {
  const origin = req.headers.get("origin");
  if (!origin) return;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new ServiceError("forbidden", "Cross-site requests are not allowed.");
  }
  if (!host || originHost !== host) throw new ServiceError("forbidden", "Cross-site requests are not allowed.");
}

export async function readJson(req: Request): Promise<unknown> {
  const type = req.headers.get("content-type") ?? "";
  if (!type.includes("application/json")) throw new ServiceError("invalid_input", "Send JSON.");
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_JSON_BYTES) throw new ServiceError("invalid_input", "Request is too large.");
  const text = await req.text();
  if (text.length > MAX_JSON_BYTES) throw new ServiceError("invalid_input", "Request is too large.");
  try {
    return JSON.parse(text);
  } catch {
    throw new ServiceError("invalid_input", "Request body is not valid JSON.");
  }
}
