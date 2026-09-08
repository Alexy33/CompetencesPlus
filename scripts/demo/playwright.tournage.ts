import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.DEMO_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: ".",
  testMatch: "tournage.spec.ts",
  timeout: 240_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  outputDir: "../../docs/captures/video",

  use: {
    baseURL,
    headless: process.env.DEMO_HEADED !== "1",

    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    locale: "fr-FR",
    timezoneId: "Europe/Paris",
    video: { mode: "on", size: { width: 1440, height: 900 } },
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
  ],
});
