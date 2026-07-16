import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3311",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } }, // 412px chromium — asserts §5B rules
  ],
  webServer: {
    command: "npm run start -- -p 3311",
    port: 3311,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
