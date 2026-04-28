# qa-template

Drop-in QA infrastructure for any web project. **Playwright + Lighthouse + LambdaTest real devices**, wired up with GitHub Actions. Ten-minute setup on any repo.

---

## What it does

On every `git push` (or manual trigger, or weekly cron):

| Check | Where it runs | Time |
|---|---|---|
| **Playwright smoke** | 7 emulated devices (Desktop Chrome/Chrome1280/Safari, iPhone 14, iPhone SE, Pixel 7, iPad Pro) | ~4 min |
| **Lighthouse CI** | Auto-discovered URLs from `sitemap.xml` — performance, a11y, SEO, best-practices budgets | ~3 min |
| **LambdaTest real devices** | 6 real desktop browsers (macOS Chrome/Safari/Firefox + Windows 11 Chrome/Edge/Firefox) × all sitemap URLs | ~2.5 min |

**Each smoke check asserts per page:**
- HTTP 200 (no 4xx/5xx)
- No JS errors in console
- `nav`/`header` visible
- Forms accept file uploads
- Input font-size ≥16px (iOS zoom prevention)

Result: either everything green ✅, or a precise failure (device + page + reason).

---

## Install on a new project

```bash
# One-liner (from your project root, must be a git repo)
curl -fsSL https://raw.githubusercontent.com/azinoviev-pixel/qa-template/main/install.sh | bash
```

This copies workflows + tests + configs into your project.

Then in GitHub repo Settings:

| Kind | Name | Value |
|---|---|---|
| Variable | `BASE_URL` | `https://your-site.com` |
| Secret | `LT_USERNAME` | your LambdaTest username |
| Secret | `LT_ACCESS_KEY` | your LambdaTest access key |

Push anything to `main` → CI runs automatically.

---

## Stack

| Layer | Tool | Why |
|---|---|---|
| Functional smoke | Playwright Test Runner | 7 emulated device profiles, parallel |
| Performance/a11y/SEO | `@lhci/cli` | Auto-discovers URLs from `sitemap.xml`, asserts per-page budgets |
| Real desktop browsers | LambdaTest free tier | 6 real browsers (macOS Chrome/Safari/Firefox + Win11 Chrome/Edge/Firefox). Prevents Safari-only bugs |
| Real mobile (optional) | LambdaTest $199/mo Automation plan | 10 000+ real iPhone/Android — not enabled by default (paid) |

---

## Files

```
qa-template/
├── .github/workflows/
│   ├── qa.yml                    # Playwright + Lighthouse (push + schedule + dispatch)
│   └── lambdatest.yml            # Real devices (weekly + manual)
├── scripts/
│   └── lhci-discover.mjs         # Auto-find URLs from sitemap.xml, write lighthouserc.json
├── tests/
│   └── smoke.spec.ts             # Page load, JS errors, nav, form, font-size
├── tests-lt/
│   └── lt_smoke.cjs              # 6 real desktop browsers via chromium.connect()
├── playwright.config.ts          # 7 emulated devices
├── playwright.lt.config.cjs      # LambdaTest workers config
├── lighthouserc.json             # Budget thresholds (a11y ≥90, SEO ≥90, perf ≥85)
└── install.sh                    # One-liner installer
```

---

## Manual trigger

```bash
# Playwright + Lighthouse
gh workflow run qa.yml -R owner/repo
# Real devices
gh workflow run lambdatest.yml -R owner/repo
```

Or via API:

```bash
curl -X POST -H "Authorization: token $GH_TOKEN" \
  https://api.github.com/repos/owner/repo/actions/workflows/qa.yml/dispatches \
  -d '{"ref":"main"}'
```

---

## How results flow

1. Workflow runs → GitHub Actions logs pass/fail per device per page
2. Read via `GET /repos/{owner}/{repo}/actions/runs/{run_id}/logs` (returns zip)
3. Grep for `N passed` / device names / failure messages
4. If green — nothing to do. If red — log has exact failure location.

Aggregate result, no need to watch videos or dashboards unless debugging.

---

## Real mobile devices (when you want them)

LambdaTest free tier blocks real mobile. To unlock:

1. Upgrade to **Real Device Plus Automation Cloud** — $199/mo annual (~$2388/year)
2. Credentials stay the same — just billing tier changes
3. Add `tests-lt/lt_mobile.cjs` with `_android.connect()` (Android) or iOS webkit endpoint
4. Box gets iPhone 14/15/SE, Galaxy S23/S24, Pixel 8, iPad Pro

Not recommended until you have ≥3 paying retainer clients — single project doesn't amortize $2388/year.

---

## License

MIT
