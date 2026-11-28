import "server-only";
import { eq } from "drizzle-orm";
import { z } from "zod";
import type { Learner } from "../auth";
import type { AppContext } from "../context";
import { users } from "../db/schema";
import { ServiceError } from "./errors";

export interface AccountView {
  id: string;
  name: string;
  email: string;
  image: string | null;
  createdAt: string;
}

/** The learner's own account. There is no way to name another learner's id. */
export async function getAccount(ctx: AppContext, learner: Learner): Promise<AccountView> {
  const [row] = await ctx.db.select().from(users).where(eq(users.id, learner.id)).limit(1);
  if (!row) throw new ServiceError("unauthenticated", "Sign in with Google to continue.");
  return { id: row.id, name: row.name, email: row.email, image: row.image, createdAt: row.createdAt.toISOString() };
}

const UpdateSchema = z.strictObject({
  name: z.string().trim().min(1, "Enter a display name.").max(80, "Keep your display name under 80 characters."),
});

export async function updateAccount(ctx: AppContext, learner: Learner, body: unknown): Promise<AccountView> {
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) throw new ServiceError("invalid_input", parsed.error.issues[0]?.message ?? "Check your details.");
  await ctx.db.update(users).set({ name: parsed.data.name, updatedAt: ctx.now() }).where(eq(users.id, learner.id));
  return getAccount(ctx, learner);
}
