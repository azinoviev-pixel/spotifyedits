const { test, expect, chromium } = require('@playwright/test');

const BASE = process.env.BASE_URL || 'https://example.com';

// Discovers URLs from sitemap.xml. Falls back to ["/"] if no sitemap.
async function discoverPaths() {
  try {
    const res = await fetch(BASE.replace(/\/$/, '') + '/sitemap.xml');
    if (!res.ok) throw new Error(`${res.status}`);
    const xml = await res.text();
    const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
    const paths = urls
      .map((u) => {
        try { return new URL(u).pathname || '/'; } catch { return null; }
      })
      .filter(Boolean);
    const deduped = [...new Set(paths)].slice(0, 12);
    console.log(`[lt] Auto-discovered ${deduped.length} paths from sitemap`);
    return deduped;
  } catch (e) {
    console.log(`[lt] sitemap unavailable (${e.message}), using ["/"]`);
    return ['/'];
  }
}

const DEVICES = [
  { name: 'macOS-Sonoma-Chrome',  browserName: 'Chrome',    platform: 'MacOS Sonoma' },
  { name: 'macOS-Sonoma-Safari',  browserName: 'pw-webkit', platform: 'MacOS Sonoma' },
  { name: 'macOS-Sonoma-Firefox', browserName: 'pw-firefox',platform: 'MacOS Sonoma' },
  { name: 'Windows11-Chrome',     browserName: 'Chrome',    platform: 'Windows 11' },
  { name: 'Windows11-Edge',       browserName: 'MicrosoftEdge', platform: 'Windows 11' },
  { name: 'Windows11-Firefox',    browserName: 'pw-firefox',platform: 'Windows 11' },
];

test.describe.configure({ mode: 'parallel' });
test.setTimeout(300_000);

for (const d of DEVICES) {
  test(`smoke on ${d.name}`, async () => {
    const caps = {
      browserName: d.browserName,
      browserVersion: 'latest',
      'LT:Options': {
        platform: d.platform,
        build: 'qa-template',
        name: d.name,
        user: process.env.LT_USERNAME,
        accessKey: process.env.LT_ACCESS_KEY,
        video: true,
        console: true,
        network: false,
      },
    };
    const wsEndpoint = `wss://cdp.lambdatest.com/playwright?capabilities=${encodeURIComponent(JSON.stringify(caps))}`;
    const paths = await discoverPaths();
    const browser = await chromium.connect(wsEndpoint);
    const page = await browser.newPage();
    const failures = [];
    try {
      for (const p of paths) {
        const errors = [];
        page.removeAllListeners('pageerror');
        page.on('pageerror', (e) => errors.push(e.message));
        const r = await page.goto(`${BASE.replace(/\/$/, '')}${p}`, { waitUntil: 'networkidle', timeout: 30_000 });
        if (!r || r.status() >= 400) { failures.push(`${p}: HTTP ${r?.status()}`); continue; }
        if (errors.length) failures.push(`${p}: JS errors → ${errors.join('; ')}`);
        const nav = await page.locator('nav, header').first().isVisible().catch(() => false);
        if (!nav) failures.push(`${p}: nav not visible`);
      }
    } finally {
      await browser.close();
    }
    expect(failures, `Fails on ${d.name}:\n${failures.join('\n')}`).toHaveLength(0);
  });
}
