# Install Guide

Two ways to install qa-template in your project — pick one.

---

## Option 1 — One-liner (recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/azinoviev-pixel/qa-template/main/install.sh | bash
```

The script:
1. Pulls the latest template into a `tests-qa/` folder
2. Asks for your `BASE_URL`
3. Installs dependencies + Playwright browsers
4. Runs a first smoke test to verify

**Time: ~3 minutes.**

---

## Option 2 — Manual (more control)

### Step 1 — Pull the template

```bash
npx degit azinoviev-pixel/qa-template tests-qa
cd tests-qa
```

### Step 2 — Install dependencies

```bash
pnpm install --no-frozen-lockfile
pnpm exec playwright install --with-deps
```

Or with npm / yarn — `pnpm` isn't required, but the workflows use it.

### Step 3 — Edit the `PAGES` arrays

Open these files and list your project's real routes:

- `tests/smoke.spec.ts`
- `tests/a11y.spec.ts`
- `tests/visual.spec.ts`
- `tests-bs/bstack_smoke.js` (keep this one short — 3–5 routes)

Example `PAGES` array:

```ts
const PAGES = [
  { path: "/", name: "Home" },
  { path: "/about", name: "About" },
  { path: "/shop", name: "Shop" },
  { path: "/contact", name: "Contact" },
];
```

### Step 4 — Run locally

```bash
BASE_URL=https://yoursite.com pnpm test
```

All passing? Good. Keep going. All failing? Check your `PAGES` are correct and site is accessible.

### Step 5 — Copy workflows to your project

```bash
mkdir -p ../.github/workflows
cp .github/workflows/*.yml ../.github/workflows/
cp browserstack.yml playwright.bs.config.js lighthouserc.json ../
cp -r tests-bs ../
```

### Step 6 — Configure GitHub secrets + variables

In your repo on GitHub: **Settings → Secrets and variables → Actions**

**Variables:**
- `BASE_URL` = your production URL (e.g., `https://yoursite.com`)

**Secrets (only if using BrowserStack):**
- `BROWSERSTACK_USERNAME`
- `BROWSERSTACK_ACCESS_KEY`

### Step 7 — First push

```bash
git add .
git commit -m "Add qa-template"
git push
```

Watch GitHub Actions run. Takes about 5 minutes for the full Playwright + Lighthouse suite.

### Step 8 — Generate visual baselines (optional)

Visual regression needs platform-specific baselines. To generate them on CI:

1. Add this temporary step to `qa.yml`:
   ```yaml
   - name: Update snapshots
     run: pnpm test:visual:update
   ```
2. Commit the generated PNGs (appear in `tests/visual.spec.ts-snapshots/`)
3. Remove the temporary step

Baseline screenshots are now tracked. Future CI runs will compare against them.

---

## Troubleshooting

### `pnpm install` fails with "packageManager mismatch"

Your project's `package.json` has a `packageManager` field. Remove `version:` from the `pnpm/action-setup@v4` step in `qa.yml`. See commit history for the fix.

### Tests skip with "BASE_URL not set"

Check that `BASE_URL` is set as a **Variable** (not Secret) in your GitHub repo settings. Variables appear in `vars.BASE_URL`, secrets in `secrets.BASE_URL`.

### Visual tests always fail

First run has no baseline. Generate baselines in CI (Step 8 above) before relying on visual tests.

### BrowserStack SDK errors at scale

Reduce `platforms[]` in `browserstack.yml` to 5–7. Their SDK becomes unstable above that. Also don't use `testObservability: true` with 10+ devices — set it to `false`.

---

## Related

- [ARCHITECTURE.md](ARCHITECTURE.md) — why each tool is in the stack
- [CUSTOMIZATION.md](CUSTOMIZATION.md) — adapt for specific frameworks (Next.js, Vite, etc.)
- [README.md](README.md) — overview
