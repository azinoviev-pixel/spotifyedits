import { test, expect } from "@playwright/test";

// EDIT PER PROJECT: list all critical routes here
const PAGES = [
  { path: "/", name: "Home" },
  // { path: "/about", name: "About" },
  // { path: "/contact", name: "Contact" },
];

test.describe("Smoke — every page loads", () => {
  for (const { path, name } of PAGES) {
    test(`${name} loads without errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (err) => errors.push(err.message));

      const response = await page.goto(path);
      expect(response?.status()).toBeLessThan(400);

      await page.waitForLoadState("networkidle", { timeout: 15_000 });

      expect(errors, `JS errors on ${name}: ${errors.join(", ")}`).toHaveLength(0);

      const hasHorizontalScroll = await page.evaluate(
        () => document.body.scrollWidth > window.innerWidth + 5
      );
      expect(hasHorizontalScroll, `Horizontal scroll on ${name}`).toBe(false);

      await expect(page.locator("main, .hero").first()).toBeVisible();
    });
  }
});

test.describe("iOS form zoom prevention", () => {
  test("form inputs have font-size >= 16px", async ({ page }) => {
    await page.goto("/");
    const inputs = page.locator('input[type="text"], input[type="email"], textarea');
    const count = await inputs.count();
    if (count === 0) test.skip();

    for (let i = 0; i < count; i++) {
      const fontSize = await inputs.nth(i).evaluate(
        (el) => parseFloat(window.getComputedStyle(el).fontSize)
      );
      expect(fontSize, `Input #${i} font-size must be >= 16px for iOS`).toBeGreaterThanOrEqual(16);
    }
  });
});
