# Architecture

Why each tool is in the stack and how they fit together.

---

## Design goals

1. **Free or trial-based** — no monthly bill from day one
2. **Portable** — works on any hosting (Vercel, Netlify, AWS, self-hosted)
3. **Mobile-honest** — catches iOS Safari bugs that emulation misses
4. **Zero lock-in** — all tools have open-source alternatives
5. **Ten-minute setup** — no architectural decisions left to the user

---

## The pipeline

```
[git push]
    │
    ├── GitHub Actions (free)
    │   ├── Playwright on 8 emulated devices
    │   │   ├── smoke.spec.ts — page loads, JS errors, h-scroll, nav
    │   │   ├── a11y.spec.ts — WCAG 2 AA via axe-core
    │   │   └── visual.spec.ts — screenshot diff
    │   └── Lighthouse CI — perf, a11y, SEO, best practices + Core Web Vitals
    │
    └── [Vercel auto-deploy] — parallel, independent
        └── Production domain updates (if auto-alias enabled)

[weekly cron / manual trigger]
    └── BrowserStack on 5 real devices
        └── Same smoke tests, real iOS Safari + real Android Chrome
```

Tests run **against the deployed URL** — not against local builds. This means:

- We catch issues that only appear in the deployed environment (CDN headers, HTTPS, meta tag injection)
- We don't need to wait for a dev server to start in CI
- The same tests work for staging and production by changing `BASE_URL`

---

## Tool selection — why these five

### Playwright

**Chose because:** supports Chromium + WebKit + Firefox in one config, active Microsoft maintenance, excellent docs, fast.

**Alternatives considered:**
- **Cypress** — Chromium only by default (WebKit is a paid add-on). Ruled out.
- **Selenium** — slower, more setup, legacy feel.
- **Puppeteer** — Chromium only. No WebKit. Ruled out.

Playwright runs headlessly in CI and gives us the widest browser coverage for free.

### axe-core (via @axe-core/playwright)

**Chose because:** industry standard for automated a11y. Deque maintains it. Rules map directly to WCAG 2.0/2.1/2.2.

**Alternatives:**
- **pa11y** — command-line, less granular
- **WAVE** — browser extension, not CI-friendly

axe finds ~30% of all a11y issues automatically. The other 70% need manual testing, but 30% is a huge win for zero effort.

### Lighthouse CI

**Chose because:** Google-authored, same engine as Chrome DevTools "Lighthouse" tab. Production-tested on millions of sites. Free.

**Alternatives:**
- **WebPageTest** — more accurate but paid for CI
- **SpeedCurve / Calibre** — better UIs but $100+/mo

Lighthouse CI gives us a repeatable baseline score across 4 categories with budget enforcement.

### BrowserStack

**Chose because:** 3000+ real devices in cloud, official Playwright SDK, video recording.

**Alternatives:**
- **LambdaTest** — cheaper ($15 vs $29) but smaller device lab
- **Sauce Labs** — enterprise-focused, expensive
- **Appium + self-hosted device farm** — free but requires owning devices

BrowserStack has the best Playwright integration. Tradeoff: only 100 trial minutes total (not monthly).

### GitHub Actions

**Chose because:** free for public repos, 2000 minutes/month for private. Integrated with GitHub, no separate CI account.

**Alternatives:**
- **CircleCI / TravisCI** — fine, but GitHub Actions ships natively with the repo
- **Vercel Checks** — free but limited to Vercel-hosted builds

Actions are the path of least resistance for a GitHub-hosted project.

---

## Split between `tests/` and `tests-bs/`

Two separate test folders because BrowserStack mobile has an API constraint that breaks standard Playwright patterns.

**`tests/` (for emulated Playwright):**
- One `test()` per page (standard Playwright pattern)
- Each test gets its own browser context — isolated
- Runs against `BASE_URL` from environment

**`tests-bs/` (for BrowserStack):**
- One big `test()` with a `for` loop over pages
- Single browser context reused across pages
- **Why:** BrowserStack real mobile devices raise `"Only one browser context is allowed"` error when Playwright creates a fresh context per test

The two folders test the same things, different structure.

---

## Why tests run against deployed URL (not localhost)

Three reasons:

1. **Catches deployment bugs.** Meta tag injection, security headers, HTTPS redirects, CDN edge behavior — all only testable against the real deploy.
2. **No dev server needed in CI.** Starting a dev server adds 30s+ per run and can fail independently of tests.
3. **Same tests, all environments.** Point `BASE_URL` at staging for staging tests, production for production. No config branching.

Tradeoff: tests only cover the live version. Broken local-only changes won't be caught. Solution: run `pnpm test` locally before pushing.

---

## File responsibilities

| File | Owned by | Changes |
|---|---|---|
| `tests/*.spec.ts` | You (per project) | `PAGES` array only; logic is template-owned |
| `tests-bs/bstack_smoke.js` | You (per project) | `PAGES` array only |
| `playwright.config.ts` | Template — don't fork | Update template repo if device list needs change |
| `browserstack.yml` | Template | Adjust platforms only if paying customer with more minutes |
| `.github/workflows/qa.yml` | Template | Adjust thresholds in `lighthouserc.json`, not workflow |
| `lighthouserc.json` | You (per project) | Set perf/SEO budgets for your project |

The principle: **per-project configuration is in data files (`PAGES`, `BASE_URL`, `lighthouserc.json` budgets). Test logic stays in the template.** Upgrade path: `git pull` template updates without touching your routes.

---

## Gotchas

### Visual baselines are platform-specific

Playwright generates different PNGs on macOS vs Linux. Baselines must be generated on the same OS as CI (Linux for GitHub Actions). First CI run always fails until baselines are pushed.

**Solution:** after first real CI run, trigger the workflow manually with `--update-snapshots`, commit the generated PNGs, let subsequent runs compare.

### BrowserStack mobile single-context

Already documented, but worth repeating: if you want to add more real-device tests, keep them in `tests-bs/` using the loop pattern, not the test-per-page pattern.

### Lighthouse flakes

Lighthouse scores can vary 5–10 points between runs due to network jitter. Our `lighthouserc.json` uses `numberOfRuns: 3` and takes the median. If budgets are too tight, you'll see false failures.

### Cron runs consume BrowserStack minutes

`browserstack.yml` runs every Monday by default. Each run uses ~5–10 minutes of your trial/plan. 100 trial minutes = ~10–15 weeks of weekly runs.

To stretch: bump cron to monthly or disable schedule.

---

## Extending

Common extensions:

- **Auth-gated pages:** use Playwright's `storageState` — log in once in a setup, save cookies, reuse for all tests
- **API tests:** add `tests/api.spec.ts` — Playwright has `request` fixture for HTTP assertions without a browser
- **E2E user flows:** write higher-level tests like "sign up → checkout → payment" in `tests/flows/`
- **Percy visual regression:** replace `visual.spec.ts` with Percy integration for cloud-hosted review UI
- **Sentry source maps upload:** add a step to `qa.yml` that uploads source maps after build

Keep new patterns in the template repo — that way they propagate to all projects via `git pull`.

---

## Version history

See [CHANGELOG.md](CHANGELOG.md).
