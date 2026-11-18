import "server-only";
import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

/**
 * Keyed hashes for values we must recognise again but must not store in the clear:
 * prompts (cache keys) and IP addresses (rate limits). `purpose` separates the hash spaces,
 * so a prompt hash can never be compared with an IP hash.
 */
export function hmac(secret: string, purpose: "prompt" | "subject", value: string): string {
  return createHmac("sha256", secret).update(`${purpose}\u0000${value}`).digest("base64url");
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("base64url");
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

const ALPHABET = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no look-alikes

/** Short, unguessable public slug for share links (~57 bits at 10 chars). */
export function shareSlug(length = 10): string {
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/**
 * Normalise a prompt for cache keying: Unicode NFKC, lower case, collapsed whitespace.
 * Classification does not depend on case or spacing, so equivalent prompts share a cache entry.
 */
export function normalizePrompt(prompt: string): string {
  return prompt.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();
}
