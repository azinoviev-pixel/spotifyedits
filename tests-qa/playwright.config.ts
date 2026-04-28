import { defineConfig, devices } from "@playwright/test";

// Common screen resolutions from statcounter worldwide data (2024-2025).
// Covers: 4K desktops, HD laptops, MacBooks, iPads in both orientations,
// common Android phones, iPhones SE through Pro Max.
// Total: 14 device profiles.

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: process.env.BASE_URL || "https://test2.mariachiart.com",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    // Desktop — 4 most common resolutions worldwide
    { name: "Desktop 4K (2560x1440)",  use: { ...devices["Desktop Chrome"], viewport: { width: 2560, height: 1440 } } },
    { name: "Desktop FHD (1920x1080)", use: { ...devices["Desktop Chrome"], viewport: { width: 1920, height: 1080 } } },
    { name: "Desktop MacBook (1440x900)", use: { ...devices["Desktop Safari"], viewport: { width: 1440, height: 900 } } },
    { name: "Desktop Laptop HD (1366x768)", use: { ...devices["Desktop Chrome"], viewport: { width: 1366, height: 768 } } },
    { name: "Desktop Small (1280x800)", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } } },

    // Tablet — iPad portrait/landscape + Android tablet
    { name: "iPad Pro Landscape", use: { ...devices["iPad Pro 11 landscape"] } },
    { name: "iPad Portrait (768x1024)", use: { ...devices["iPad Pro 11"] } },
    { name: "iPad Mini (768x1024)", use: { ...devices["iPad Mini"] } },

    // Mobile — covering 320-430 width
    { name: "iPhone Pro Max (428x926)", use: { ...devices["iPhone 14 Pro Max"] } },
    { name: "iPhone 14 (390x844)", use: { ...devices["iPhone 14"] } },
    { name: "Pixel 7 (412x915)", use: { ...devices["Pixel 7"] } },
    { name: "Galaxy S9+ (360x740)", use: { ...devices["Galaxy S9+"] } },
    { name: "iPhone SE (375x667)", use: { ...devices["iPhone SE"] } },
    { name: "Small Mobile (320x568)", use: { ...devices["iPhone SE"], viewport: { width: 320, height: 568 } } },
  ],
});
