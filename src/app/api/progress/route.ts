import { getAppContext } from "@/server/context";
import { assertSameOrigin, errorJson, json, readJson, requireLearner } from "@/server/http";
import { getProgress, markProgress } from "@/server/services/progress";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const ctx = await getAppContext();
    return json(await getProgress(ctx, await requireLearner(ctx, req)));
  } catch (error) {
    return errorJson(error, "GET /api/progress");
  }
}

/** Mark or unmark one lesson: { slug, done }. */
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const ctx = await getAppContext();
    const learner = await requireLearner(ctx, req);
    return json(await markProgress(ctx, learner, await readJson(req)));
  } catch (error) {
    return errorJson(error, "POST /api/progress");
  }
}
