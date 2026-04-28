# Customization

Recipes for adapting the template to specific frameworks and scenarios.

---

## Per-framework notes

### Next.js (App Router)

Works out of the box. Routes map to file structure:

```ts
const PAGES = [
  { path: "/", name: "Home" },           // app/page.tsx
  { path: "/about", name: "About" },     // app/about/page.tsx
  { path: "/blog/[slug]", name: "Blog" }, // use a real slug for testing
];
```

For dynamic routes with `[slug]`, test against a known-good slug:

```ts
{ path: "/blog/hello-world", name: "Blog post" }
```

### Vite / React SPA (wouter, React Router)

Client-side routing. `BASE_URL` should point at the root; Playwright handles SPA navigation.

If your SPA has a 404 route that returns status 200 (common for SPAs), skip the status check for unknown routes:

```ts
test("404 page shows correctly", async ({ page }) => {
  await page.goto("/definitely-not-a-real-route");
  // Don't assert status; SPAs return 200 for 404 pages
  await expect(page.locator("text=Not Found")).toBeVisible();
});
```

### Static site (Astro, 11ty, Hugo)

Works perfectly — static sites are Lighthouse's favorite environment. All scores should be 95+.

Tune `lighthouserc.json` budgets upward:

```json
{
  "categories:performance": ["error", { "minScore": 0.95 }]
}
```

### Server-side apps (Rails, Django, Laravel)

Point `BASE_URL` at staging. Make sure staging has a test user with predictable credentials — use Playwright's `storageState` to bypass login:

```ts
// tests/auth.setup.ts
import { test as setup } from '@playwright/test';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name=email]', 'test@example.com');
  await page.fill('input[name=password]', process.env.TEST_PASSWORD!);
  await page.click('button[type=submit]');
  await page.waitForURL('/dashboard');
  await page.context().storageState({ path: 'tests/.auth/user.json' });
});
```

Add to `playwright.config.ts`:

```ts
projects: [
  { name: 'setup', testMatch: /.*\.setup\.ts/ },
  {
    name: 'authenticated',
    use: { storageState: 'tests/.auth/user.json' },
    dependencies: ['setup'],
  },
];
```

---

## Common customizations

### Add a new test file

```bash
# Create the file
cat > tests/checkout.spec.ts <<'EOF'
import { test, expect } from "@playwright/test";

test("checkout flow completes", async ({ page }) => {
  await page.goto("/shop");
  await page.click("text=Add to cart");
  await page.click("text=Checkout");
  // ...
});
EOF

# Playwright auto-discovers tests in tests/ — no config change needed
pnpm test tests/checkout.spec.ts
```

### Skip specific tests in CI

Use `test.skip()` with a condition:

```ts
test("expensive integration test", async ({ page }) => {
  test.skip(!!process.env.CI, "Too slow for CI, run locally only");
  // ...
});
```

### Run tests only on specific devices

Tag tests:

```ts
test("mobile-only test", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("iPhone"), "Mobile only");
  // ...
});
```

### Custom Lighthouse budgets per page

Edit `lighthouserc.json`:

```json
{
  "ci": {
    "collect": {
      "url": [
        "${LHCI_URL}/",
        "${LHCI_URL}/shop",
        "${LHCI_URL}/contact"
      ],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["warn", { "minScore": 0.85 }]
      }
    }
  }
}
```

### Disable BrowserStack entirely

Delete `browserstack.yml` workflow and `browserstack.yml` config. Remove the `tests-bs/` folder. Done.

---

## Environment variables reference

| Variable | Where | Purpose |
|---|---|---|
| `BASE_URL` | GitHub Variables | URL tests run against |
| `BROWSERSTACK_USERNAME` | GitHub Secrets | BrowserStack auth (encrypted) |
| `BROWSERSTACK_ACCESS_KEY` | GitHub Secrets | BrowserStack auth (encrypted) |
| `LHCI_URL` | Derived from `BASE_URL` in workflow | Lighthouse target |
| `CI` | Set by GitHub Actions automatically | Enables retries, single worker |

Locally, for development:

```bash
# .env.local (git-ignored)
BASE_URL=http://localhost:5173
BROWSERSTACK_USERNAME=your-user
BROWSERSTACK_ACCESS_KEY=your-key
```

Then run:

```bash
source .env.local
pnpm test
```

---

## When to fork vs contribute back

**Fork the template if:**
- Your project has unique requirements (auth, specific browsers, custom reporters)
- You want to add project-specific tests inline

**Contribute back if:**
- You find a bug in the template
- You add a pattern that's broadly useful (e.g., a new standard test type)
- You document a gotcha not yet covered

Contributions via PR: <https://github.com/azinoviev-pixel/qa-template/pulls>
