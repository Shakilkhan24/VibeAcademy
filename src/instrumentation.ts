import type { Instrumentation } from "next";

const routeAreas = new Set(["api", "cards", "lab", "learn", "open", "privacy", "waitlist", "x", "xray"]);

/** Only fixed route areas enter the log. A request path can contain a share link or query string. */
export const onRequestError: Instrumentation.onRequestError = (_error, _request, context) => {
  const root = context.routePath.split("/")[1] ?? "";
  let area = "other";
  if (context.routePath === "/" || context.routePath === "/page") area = "home";
  else if (routeAreas.has(root)) area = root;

  console.error(JSON.stringify({
    event: "server_request_failure",
    timestamp: new Date().toISOString(),
    area,
    kind: context.routeType,
  }));
};
