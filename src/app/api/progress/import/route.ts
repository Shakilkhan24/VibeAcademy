import { getAppContext } from "@/server/context";
import { assertSameOrigin, errorJson, json, readJson, requireLearner } from "@/server/http";
import { importProgress } from "@/server/services/progress";

export const runtime = "nodejs";

/** Merge the browser checklist into the signed-in learner's saved progress: { slugs }. */
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const ctx = await getAppContext();
    const learner = await requireLearner(ctx, req);
    return json(await importProgress(ctx, learner, await readJson(req)));
  } catch (error) {
    return errorJson(error, "POST /api/progress/import");
  }
}
