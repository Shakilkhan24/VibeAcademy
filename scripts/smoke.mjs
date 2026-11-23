/**
 * End-to-end smoke test against a RUNNING server (dev or production build).
 *   BASE_URL=http://localhost:3000 pnpm smoke
 * Walks the Phase 0 journey: pages render, X-Ray runs, sharing hides the prompt, the share
 * image renders, unsharing and deletion work, the waitlist accepts a sign-up, and security
 * headers are present. Exits non-zero on the first failed check.
 */
const BASE = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const PROMPT =
  "Build me a booking app for my yoga studio. Members sign up with Google, book classes and pay with Stripe. Store everything in Supabase.";
const SECRET_WORD = "yoga studio";
let failures = 0;

function check(name, ok, detail = "") {
  console.info(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
  if (!ok) failures++;
}

async function get(path) {
  const res = await fetch(BASE + path, { redirect: "manual" });
  return { res, text: res.headers.get("content-type")?.includes("image") ? "" : await res.text() };
}

async function send(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { "content-type": "application/json", origin: BASE },
    body: JSON.stringify(body),
  });
  return { res, json: await res.json().catch(() => null) };
}

for (const [path, mustContain] of [
  ["/", "Every prompt hides decisions"],
  ["/learn", "The learning path"],
  ["/learn/choose-one-job", "Choose one person and one job"],
  ["/learn/sketch-the-first-workflow", "Decisions this tutorial covers"],
  ["/learn/write-a-testable-build-prompt", "Describe an empty day"],
  ["/learn/choose-an-order-book", "Prove it with a late pickup"],
  ["/learn/sketch-order-permissions", "Prove it by swapping roles"],
  ["/learn/write-the-bakery-spec", "Prove it with two customers named Jo"],
  ["/xray", "Prompt X-Ray"],
  ["/cards", "Decisions in the order your app meets them"],
  ["/cards/who-sees-what", "Who can see whose data?"],
  ["/lab", "Same idea, built twice"],
  ["/lab/ep01-preorder-shop", "Not measured yet"],
  ["/open", "Open numbers"],
  ["/waitlist", "Get in first"],
  ["/privacy", "What we keep"],
  ["/sitemap.xml", "/cards/one-job"],
]) {
  const { res, text } = await get(path);
  check(`GET ${path}`, res.status === 200 && text.includes(mustContain), `status ${res.status}`);
}

const health = await get("/api/health");
const lesson = await get("/learn/choose-one-job");
const path = await get("/learn");
check("the Dream review status appears on the learning path and reader", path.text.includes(">Reviewed<") && lesson.text.includes(">Reviewed<"));
check("reader has a completion control", lesson.text.includes("Mark as done"));
const learningMap = await get("/sitemap.xml");
check("sitemap includes the tutorial reader", learningMap.text.includes("/learn/write-a-testable-build-prompt"));
const missingLesson = await get("/learn/unknown-lesson");
check("unknown lesson returns 404", missingLesson.res.status === 404);
for (const url of ["/learn/opengraph-image", "/learn/choose-one-job/opengraph-image"]) {
  const image = await fetch(BASE + url);
  check(`learning path share image at ${url}`, image.ok && image.headers.get("content-type")?.includes("image/png"));
}
check("health endpoint", health.res.status === 200 && JSON.parse(health.text).ok === true, health.text);

const home = await get("/");
for (const h of ["content-security-policy", "x-content-type-options", "x-frame-options", "referrer-policy"]) {
  check(`security header ${h}`, Boolean(home.res.headers.get(h)));
}

const run = await send("POST", "/api/xray", { prompt: PROMPT });
check("POST /api/xray", run.res.status === 201 && typeof run.json?.score === "number", `status ${run.res.status}, mode ${run.json?.mode}`);
check("X-Ray response does not echo the prompt", !JSON.stringify(run.json).toLowerCase().includes(SECRET_WORD));
const owner = { runId: run.json?.runId, ownerToken: run.json?.ownerToken };

const evil = await fetch(BASE + "/api/xray", { method: "POST", headers: { "content-type": "application/json", origin: "https://evil.example" }, body: JSON.stringify({ prompt: PROMPT }) });
check("cross-site POST rejected", evil.status === 403, `status ${evil.status}`);

const share = await send("POST", "/api/xray/share", owner);
check("share link created", share.res.status === 200 && /\/x\/[A-Za-z0-9]+$/.test(share.json?.url ?? ""), share.json?.url);
const slug = share.json?.slug;

const shared = await get(`/x/${slug}`);
check("shared page renders", shared.res.status === 200 && shared.text.includes("decisions left to the AI"), `status ${shared.res.status}`);
check("shared page hides the prompt", !shared.text.toLowerCase().includes(SECRET_WORD));

const og = await fetch(`${BASE}/x/${slug}/opengraph-image`);
check("share image renders", og.status === 200 && (og.headers.get("content-type") ?? "").includes("image/png"), `status ${og.status}`);

const unshare = await send("DELETE", "/api/xray/share", owner);
check("unshare", unshare.res.status === 200);
const gone = await get(`/x/${slug}`);
check("unshared page is gone", gone.res.status === 404, `status ${gone.res.status}`);

const del = await send("DELETE", "/api/xray", owner);
check("delete run", del.res.status === 200);

const wl = await send("POST", "/api/waitlist", { email: `smoke+${Date.now()}@example.com`, tool: "lovable", consent: true });
check("waitlist sign-up", wl.res.status === 201, `status ${wl.res.status}`);

const open = await get("/open");
check("/open counts the X-Ray run", /Prompt X-Rays run/.test(open.text));
check("/open reports event-based signup rates", open.text.includes("Waitlist sign-ups per day") && open.text.includes("Waitlist sign-ups per 100 X-Rays"));

console.info(failures === 0 ? "\nAll smoke checks passed." : `\n${failures} smoke check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
