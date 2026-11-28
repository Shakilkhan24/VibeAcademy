import { toNextJsHandler } from "better-auth/next-js";
import { getAppContext } from "@/server/context";

export const runtime = "nodejs";

/** Better Auth endpoints: Google sign-in start and callback, session, sign-out. */
async function handle(req: Request) {
  const { auth } = await getAppContext();
  const handler = toNextJsHandler(auth);
  return req.method === "POST" ? handler.POST(req) : handler.GET(req);
}

export { handle as GET, handle as POST };
