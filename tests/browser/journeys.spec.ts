import { expect, test } from "@playwright/test";

test("submit an X-Ray and revoke its public share link", async ({ page, browser }) => {
  await page.goto("/xray");
  await page.getByRole("textbox", { name: /prompt you would give/ }).fill("Build a preorder shop for a neighbourhood bakery.");
  await page.getByRole("button", { name: "Run the X-Ray" }).click();
  await expect(page.getByText("Rule-based check", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Create share link" }).click();
  const link = page.getByRole("textbox", { name: "Share link" });
  await expect(link).toHaveValue(/\/x\/[a-zA-Z0-9]+$/);
  const url = await link.inputValue();

  const visitor = await browser.newPage({ viewport: page.viewportSize() });
  try {
    await visitor.goto(url);
    await expect(visitor.getByRole("heading", { name: /decisions left to the AI/ })).toBeVisible();
    await page.getByRole("button", { name: "Stop sharing" }).click();
    await expect(page.getByRole("button", { name: "Create share link" })).toBeVisible();
    expect((await visitor.reload())?.status()).toBe(404);
  } finally {
    await visitor.close();
  }
});

test("mark a lesson done and sync the learning path across tabs", async ({ page, context }) => {
  await page.goto("/learn");
  const progress = page.getByRole("progressbar");
  const total = await progress.getAttribute("max");
  await expect(progress).toHaveAccessibleName(`0 of ${total} lessons completed`);
  const lesson = await context.newPage();
  await lesson.goto("/learn/choose-one-job");
  await lesson.getByRole("button", { name: "Mark as done" }).click();
  await expect(progress).toHaveAccessibleName(`1 of ${total} lessons completed`);
  await page.reload();
  await expect(progress).toHaveAttribute("value", "1");
  await lesson.getByRole("button", { name: "Mark as incomplete" }).click();
  await expect(progress).toHaveAccessibleName(`0 of ${total} lessons completed`);
});

test("copy a lesson block", async ({ page, context, baseURL }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: baseURL });
  await page.goto("/learn/write-a-testable-build-prompt");
  const expected = await page.locator("pre code").first().textContent();
  await page.getByRole("button", { name: "Copy block" }).first().click();
  await expect(page.getByRole("button", { name: "Copied" })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(expected);
});

test("change explanation depth with the keyboard and retain it on reload", async ({ page }) => {
  await page.goto("/cards/one-job");
  const dial = page.getByRole("radiogroup", { name: "Explanation depth" });
  const practical = dial.getByRole("radio", { name: /Practical/ });
  const technical = dial.getByRole("radio", { name: /Technical/ });
  await expect(practical).toBeChecked();
  await practical.press("ArrowRight");
  await expect(technical).toBeFocused();
  await expect(technical).toBeChecked();
  await page.reload();
  await expect(technical).toBeChecked();
  await technical.press("ArrowLeft");
  await expect(practical).toBeChecked();
});

test("join the waitlist", async ({ page }, testInfo) => {
  await page.goto("/waitlist");
  await page.getByRole("textbox", { name: "Email", exact: true }).fill(`browser-${testInfo.project.name}@example.com`);
  await page.getByRole("checkbox", { name: /Email me when/ }).check();
  await page.getByRole("button", { name: "Join the waitlist" }).click();
  await expect(page.getByRole("status")).toContainText("You're on the list");
});
