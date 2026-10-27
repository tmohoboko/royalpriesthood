import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/commerce",
  timeout: 45000,
  workers: 1,
  reporter: [
    ["list"],
    ["json", { outputFile: "qa/commerce-e2e-results.json" }],
  ],
  use: {
    baseURL: "http://127.0.0.1:4173",
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
      : {},
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node scripts/commerce-test-server.mjs",
    url: "http://127.0.0.1:4173/api/commerce/health",
    reuseExistingServer: false,
    timeout: 30000,
  },
});
