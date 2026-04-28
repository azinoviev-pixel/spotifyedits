import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// EDIT PER PROJECT: list all routes to check for accessibility
const PAGES = [
  "/",
  // "/about",
  // "/contact",
];

for (const path of PAGES) {
  test(`a11y (WCAG 2 AA) — ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const critical = results.violations.filter((v) => v.impact === "critical" || v.impact === "serious");

    expect(
      critical,
      `A11y violations on ${path}:\n${JSON.stringify(critical, null, 2)}`
    ).toEqual([]);
  });
}
