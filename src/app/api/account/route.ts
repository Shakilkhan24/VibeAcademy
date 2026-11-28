import { getAppContext } from "@/server/context";
import { assertSameOrigin, errorJson, json, readJson, requireLearner } from "@/server/http";
import { getAccount, updateAccount } from "@/server/services/account";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const ctx = await getAppContext();
    return json(await getAccount(ctx, await requireLearner(ctx, req)));
  } catch (error) {
    return errorJson(error, "GET /api/account");
  }
}

export async function PATCH(req: Request) {
  try {
    assertSameOrigin(req);
    const ctx = await getAppContext();
    const learner = await requireLearner(ctx, req);
    return json(await updateAccount(ctx, learner, await readJson(req)));
  } catch (error) {
    return errorJson(error, "PATCH /api/account");
  }
}
