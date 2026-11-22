import { getAppContext } from "@/server/context";
import { assertSameOrigin, clientIp, errorJson, json, readJson } from "@/server/http";
import { deleteRun, runXRay } from "@/server/services/xray";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Run a Prompt X-Ray. Body: { prompt }. The prompt is never stored or echoed back. */
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const body = (await readJson(req)) as { prompt?: unknown };
    const ctx = await getAppContext();
    const result = await runXRay(ctx, { prompt: body?.prompt, clientIp: clientIp(req) });
    return json(result, 201);
  } catch (error) {
    return errorJson(error, "POST /api/xray");
  }
}

/** Delete a stored X-Ray. Body: { runId, ownerToken }. */
export async function DELETE(req: Request) {
  try {
    assertSameOrigin(req);
    const ctx = await getAppContext();
    await deleteRun(ctx, await readJson(req));
    return json({ ok: true });
  } catch (error) {
    return errorJson(error, "DELETE /api/xray");
  }
}
