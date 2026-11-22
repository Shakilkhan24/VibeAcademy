import { getAppContext } from "@/server/context";
import { assertSameOrigin, errorJson, json, readJson } from "@/server/http";
import { shareRun, unshareRun } from "@/server/services/xray";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Opt in to sharing. Body: { runId, ownerToken }. Returns { slug, url }. */
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const ctx = await getAppContext();
    return json(await shareRun(ctx, await readJson(req)));
  } catch (error) {
    return errorJson(error, "POST /api/xray/share");
  }
}

/** Stop sharing. Body: { runId, ownerToken }. */
export async function DELETE(req: Request) {
  try {
    assertSameOrigin(req);
    const ctx = await getAppContext();
    await unshareRun(ctx, await readJson(req));
    return json({ ok: true });
  } catch (error) {
    return errorJson(error, "DELETE /api/xray/share");
  }
}
