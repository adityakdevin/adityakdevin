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
    { name: "mobile", use: { ...devices["Pixel 7"] } }, // 412px chromium - asserts S5B rules
  ],
  webServer: {
    command: "npm run start -- -p 3311",
    port: 3311,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    // Fixture posts let the post-page flows (index → post → CTA, homepage
    // Field-notes) execute in E2E before real posts ship. NOTE: only effective
    // when the preceding `npm run build` also ran with POSTS_DIR set - pages
    // are static, so the build bakes the posts in. `npm run test:e2e` handles this.
    env: { POSTS_DIR: "tests/fixtures/posts" },
  },
});
