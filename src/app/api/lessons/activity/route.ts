import { getAppContext } from "@/server/context";
import { assertSameOrigin, clientIp, errorJson, json, readJson } from "@/server/http";
import { saveLessonActivity } from "@/server/services/lesson-activity";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const body = await readJson(req);
    const ctx = await getAppContext();
    await saveLessonActivity(ctx, body, clientIp(req, ctx.config.trustProxy));
    return json({ ok: true });
  } catch (error) {
    return errorJson(error, "POST /api/lessons/activity");
  }
}
