import { test, expect } from "@playwright/test";

// EDIT PER PROJECT: list routes that should be pixel-stable
const PAGES = [
  "/",
];

for (const path of PAGES) {
  test(`visual regression — ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");

    // Mask dynamic content (timestamps, carousels) if needed:
    // await page.locator("[data-dynamic]").evaluateAll(els => els.forEach(e => e.style.visibility = "hidden"));

    await expect(page).toHaveScreenshot(
      `${(path.replace(/\//g, "_") || "_home").replace(/^_/, "") || "home"}.png`,
      { fullPage: true }
    );
  });
}
