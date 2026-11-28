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
  ["/learn/keep-the-bakery-key-on-the-server", "Prove it on your deployed preview"],
  ["/learn/check-who-can-read-an-order", "Prove it through your own order reader"],
  ["/learn/confirm-payment-before-packing", "Prove it with a late receipt"],
  ["/cards/confirm-a-payment", "When can you mark an order paid?"],
  ["/cards/keep-a-build-spec", "Where will the builder find the agreed spec?"],
  ["/cards/choose-a-sign-in-method", "How will customers sign in and sign out?"],
  ["/cards/choose-what-to-log", "What should a failed pickup reminder leave in the logs?"],
  ["/cards/limit-repeat-requests", "How many reminders can one person send?"],
  ["/cards/estimate-the-monthly-bill", "What makes the bakery app’s bill grow?"],
  ["/xray", "Prompt X-Ray"],
  ["/cards", "Decisions in the order your app meets them"],
  ["/cards/who-sees-what", "Who can see whose data?"],
  ["/lab", "Same idea, built twice"],
  ["/lab/ep01-preorder-shop", "Not measured yet"],
  ["/open", "Open numbers"],
  ["/waitlist", "Get in first"],
  ["/privacy", "What we keep"],
  ["/terms", "Terms of use"],
  ["/sitemap.xml", "/cards/one-job"],
]) {
  const { res, text } = await get(path);
  check(`GET ${path}`, res.status === 200 && text.includes(mustContain), `status ${res.status}`);
  if (res.headers.get("content-type")?.includes("text/html")) {
    const footers = text.match(/<footer\b[^>]*>[\s\S]*?<\/footer>/g) ?? [];
    check(`Privacy and Terms in the footer on ${path}`, footers.some((footer) => footer.includes('href="/privacy"') && footer.includes('href="/terms"')));
  }
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
check("home link uses the confirmed brand", home.text.includes('aria-label="VibeAcademy home"'));
check("lesson share metadata includes the confirmed site name", lesson.text.includes('property="og:site_name" content="VibeAcademy"'));
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

// Accounts (M2). The smoke run has no Google credentials, so it checks the signed-out paths.
const signIn = await get("/sign-in");
check("sign-in page renders", signIn.res.status === 200 && signIn.text.includes("Keep your progress on every device"), `status ${signIn.res.status}`);
const accountPage = await get("/account");
check("account page sends signed-out visitors to sign in", [303, 307, 308].includes(accountPage.res.status) && (accountPage.res.headers.get("location") ?? "").includes("/sign-in"), `status ${accountPage.res.status}`);
const accountApi = await get("/api/account");
check("account API requires a session", accountApi.res.status === 401, `status ${accountApi.res.status}`);
const session = await get("/api/auth/get-session");
check("session endpoint reports no session", session.res.status === 200 && ["null", ""].includes(session.text.trim()), `status ${session.res.status} ${session.text.slice(0, 40)}`);

console.info(failures === 0 ? "\nAll smoke checks passed." : `\n${failures} smoke check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
