import "server-only";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { AppContext } from "../context";
import { waitlistEntries } from "../db/schema";
import { recordEvent } from "../events";
import { hmac } from "../security/crypto";
import { hitRateLimit } from "../security/rate-limit";
import { ServiceError } from "./errors";

export const WAITLIST_TOOLS = ["lovable", "bolt", "replit", "v0", "cursor", "claude-code", "copilot", "other", "none-yet"] as const;
export const WAITLIST_EXPERIENCE = ["no-code", "reads-code", "writes-code", "professional"] as const;

export const WaitlistSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email("Enter a valid email address.")),
  tool: z.enum(WAITLIST_TOOLS).optional(),
  experience: z.enum(WAITLIST_EXPERIENCE).optional(),
  source: z.string().max(40).regex(/^[a-z0-9-]*$/).optional(),
  consent: z.literal(true, { error: "Tick the box so we can email you when SeniorSeat opens." }),
});

/**
 * Always answers the same way for new and existing emails, so the form cannot be used to
 * discover who signed up. Double opt-in arrives with the email provider (roadmap M3).
 */
export async function joinWaitlist(ctx: AppContext, input: { body: unknown; clientIp: string }): Promise<{ ok: true }> {
  if (!ctx.config.features.waitlist) throw new ServiceError("feature_disabled", "The waitlist is closed right now.");

  const parsed = WaitlistSchema.safeParse(input.body);
  if (!parsed.success) throw new ServiceError("invalid_input", parsed.error.issues[0]?.message ?? "Check the form and try again.");

  const subject = hmac(ctx.config.hashSecret, "subject", input.clientIp);
  const limit = await hitRateLimit(ctx.db, `waitlist:${subject}`, { windowSeconds: 3600, limit: ctx.config.limits.waitlistPerHour, now: ctx.now() });
  if (!limit.allowed) throw new ServiceError("rate_limited", "Too many sign-ups from this connection. Try again later.", { retryAfterSeconds: limit.retryAfterSeconds });

  const { email, tool, experience, source } = parsed.data;
  const inserted = await ctx.db
    .insert(waitlistEntries)
    .values({ id: randomUUID(), email, tool, experience, source, consentedAt: ctx.now() })
    .onConflictDoNothing({ target: waitlistEntries.email })
    .returning({ id: waitlistEntries.id });

  if (inserted.length > 0) {
    await recordEvent(ctx.db, "waitlist_joined", {
      tool: tool ?? null,
      experience: experience ?? null,
      fromXray: source === "xray",
    });
  }
  return { ok: true };
}
