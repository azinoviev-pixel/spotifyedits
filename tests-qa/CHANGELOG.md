# Changelog

All notable changes to this template.

---

## [0.2.0] — 2026-04-18

### Added
- Proper README with badges, quick start, troubleshooting
- INSTALL.md with two installation paths (one-liner + manual)
- ARCHITECTURE.md explaining tool choices
- CUSTOMIZATION.md with per-framework recipes
- install.sh bash one-liner installer
- LICENSE (MIT)
- CHANGELOG.md (this file)

### Fixed
- Workflows no longer specify pnpm version — avoids conflicts with project's `packageManager` field
- BrowserStack tests use single-context pattern for mobile compatibility

---

## [0.1.0] — 2026-04-17

### Initial release
- Playwright config for 8 emulated devices
- GitHub Actions workflow (qa.yml) — Playwright + Lighthouse on push/PR/daily
- BrowserStack workflow (browserstack.yml) — weekly + manual, 5 real devices
- axe-core accessibility (WCAG 2 AA) tests
- Visual regression via Playwright screenshots
- Lighthouse CI budgets (perf/a11y/SEO/best-practices)
- Tests split between `tests/` (emulated) and `tests-bs/` (BrowserStack)
