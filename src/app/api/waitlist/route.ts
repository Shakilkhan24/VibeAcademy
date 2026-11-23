import { getAppContext } from "@/server/context";
import { assertSameOrigin, clientIp, errorJson, json, readJson } from "@/server/http";
import { joinWaitlist } from "@/server/services/waitlist";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const ctx = await getAppContext();
    return json(await joinWaitlist(ctx, { body: await readJson(req), clientIp: clientIp(req, ctx.config.trustProxy) }), 201);
  } catch (error) {
    return errorJson(error, "POST /api/waitlist");
  }
}
