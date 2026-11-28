import { expect, test, type Page } from "@playwright/test";

/**
 * The browser side of saved progress. The test server has no Google credentials, so these
 * journeys stand in for the session and progress endpoints with page.route() and check what
 * the page does with them: import once, clear the checklist, keep it when the import fails,
 * and show only the signed-in learner's progress. The server side of the same endpoints is
 * covered with real sessions in tests/server/progress.test.ts and learner-routes.test.ts.
 */
const checklistKey = "seniorseat:learn:done:choose-one-job";

function signInAs(page: Page, userId: string | null) {
  return page.route("**/api/auth/get-session*", (route) =>
    route.fulfill({
      json: userId
        ? {
            session: { id: `s-${userId}`, userId, token: "t", expiresAt: new Date(Date.now() + 3_600_000).toISOString() },
            user: { id: userId, name: userId, email: `${userId}@example.com`, emailVerified: true, image: null },
          }
        : null,
    }),
  );
}

async function markFirstLessonInThisBrowser(page: Page) {
  await page.goto("/learn/choose-one-job");
  await page.getByRole("button", { name: "Mark as done" }).click();
  await expect(page.getByRole("button", { name: "Mark as incomplete" })).toBeVisible();
}

test("signing in imports the browser checklist once and then shows only that learner's progress", async ({ page }) => {
  await markFirstLessonInThisBrowser(page);

  const savedFor: Record<string, string[]> = { "learner-a": ["sketch-the-first-workflow"], "learner-b": [] };
  let current = "learner-a";
  const imports: { user: string; slugs: string[] }[] = [];
  await page.route("**/api/progress/import", async (route) => {
    const { slugs } = route.request().postDataJSON() as { slugs: string[] };
    imports.push({ user: current, slugs });
    savedFor[current] = [...new Set([...savedFor[current]!, ...slugs])];
    await route.fulfill({ json: { completed: savedFor[current], imported: slugs.length } });
  });
  await page.route("**/api/progress", (route) => route.fulfill({ json: { completed: savedFor[current] } }));

  await signInAs(page, "learner-a");
  await page.goto("/learn");
  const progress = page.getByRole("progressbar");
  await expect(progress).toHaveAttribute("value", "2");
  await expect(page.getByText("Saved to your account.")).toBeVisible();
  expect(imports).toEqual([{ user: "learner-a", slugs: ["choose-one-job"] }]);
  expect(await page.evaluate((key) => localStorage.getItem(key), checklistKey)).toBeNull();

  // Learner B signs in on the same browser: nothing left to import, and A's lessons are not shown.
  await page.unroute("**/api/auth/get-session*");
  current = "learner-b";
  await signInAs(page, "learner-b");
  await page.reload();
  await expect(progress).toHaveAttribute("value", "0");
  expect(imports).toHaveLength(1);
});

test("a failed import keeps the browser checklist and retries on the next page", async ({ page }) => {
  await markFirstLessonInThisBrowser(page);
  let fail = true;
  let attempts = 0;
  await page.route("**/api/progress/import", (route) => {
    attempts++;
    return fail ? route.fulfill({ status: 503, json: { error: { code: "upstream_error" } } }) : route.fulfill({ json: { completed: ["choose-one-job"], imported: 1 } });
  });
  await page.route("**/api/progress", (route) => route.fulfill({ json: { completed: [] } }));
  await signInAs(page, "learner-a");

  await page.goto("/learn");
  const progress = page.getByRole("progressbar");
  await expect(progress).toHaveAttribute("value", "1"); // the local mark is still shown
  expect(await page.evaluate((key) => localStorage.getItem(key), checklistKey)).toBe("1");

  fail = false;
  await page.reload();
  await expect(progress).toHaveAttribute("value", "1");
  await expect.poll(() => attempts).toBe(2);
  expect(await page.evaluate((key) => localStorage.getItem(key), checklistKey)).toBeNull();
});
