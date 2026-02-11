import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  outputDir: "./test-results",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI
    ? [["html", { outputFolder: "./playwright-report" }], ["github"]]
    : [["html", { outputFolder: "./playwright-report" }]],

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  globalSetup: "./global-setup",

  projects: [
    {
      name: "unauthenticated",
      testMatch: /auth\/.*\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "authenticated",
      testMatch: /^(?!auth\/).*\.spec\.ts$/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/demo-user.json",
      },
    },
  ],

  webServer: process.env.CI ? undefined : {
    command: "pnpm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
