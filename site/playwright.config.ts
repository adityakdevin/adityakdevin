import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  retries: 0,
  // 10s, not the implicit 5s: the suite shares ONE Next server across workers,
  // and the form tests assert on a mocked round trip with a deliberate 300ms
  // delay. At 107 tests that fit inside 5s; adding four tipped one test per two
  // runs over it. The assertions are unchanged - this only widens the wait.
  expect: { timeout: 10_000 },
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
