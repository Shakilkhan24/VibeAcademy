import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const path of ["/", "/learn", "/learn/choose-one-job", "/xray", "/cards", "/sign-in"]) {
  test(`accessibility on ${path}`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    const { violations } = await new AxeBuilder({ page }).analyze();
    const blocking = violations.filter(({ impact }) => impact === "serious" || impact === "critical");
    expect(blocking.map(({ id, nodes }) => ({ id, elements: nodes.map(({ target }) => target) }))).toEqual([]);
  });
}
