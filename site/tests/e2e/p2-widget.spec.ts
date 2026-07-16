import { test, expect } from "@playwright/test";

test.describe("/now and /uses", () => {
  test("/now renders with a visible last-updated stamp", async ({ page }) => {
    await page.goto("/now");
    await expect(page.getByRole("heading", { name: /what i'm doing now/i })).toBeVisible();
    await expect(page.getByText(/last updated: \d{4}-\d{2}-\d{2}/)).toBeVisible();
  });

  test("/uses renders tool groups", async ({ page }) => {
    await page.goto("/uses");
    for (const h of ["Editor & terminal", "Backend", "AI"]) {
      await expect(page.getByRole("heading", { name: h })).toBeVisible();
    }
  });
});

test.describe("case study /work/budgetgen", () => {
  test("renders narrative sections + CreativeWork JSON-LD", async ({ page }) => {
    await page.goto("/work/budgetgen");
    await expect(page.getByRole("heading", { name: /BudgetGen/ })).toBeVisible();
    for (const h of ["The problem", "The build", "The outcome"]) {
      await expect(page.getByRole("heading", { name: h })).toBeVisible();
    }
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(scripts.some((s) => JSON.parse(s)["@type"] === "CreativeWork")).toBe(true);
  });

  test("unknown slug 404s with the terminal page", async ({ page }) => {
    await page.goto("/work/not-a-project");
    await expect(page.getByText(/command not found/)).toBeVisible();
  });

  test("homepage lead work links to the case study", async ({ page }) => {
    await page.goto("/");
    const lead = page.getByRole("link", { name: /BudgetGen/ }).first();
    await expect(lead).toHaveAttribute("href", "/work/budgetgen");
  });
});

test.describe("terminal widget (offline mode)", () => {
  test("opens, boots, and answers help + whoami", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /open askaditya terminal/i }).click();
    await expect(page.getByText("AskAditya v1.0")).toBeVisible();
    const input = page.getByLabel("Terminal command input");
    await input.fill("help");
    await input.press("Enter");
    await expect(page.getByText("available commands:")).toBeVisible();
    await input.fill("whoami");
    await input.press("Enter");
    await expect(
      page.getByRole("dialog").getByText("Full Stack Developer · AI Engineer · Solution Architect"),
    ).toBeVisible();
  });

  test("cv command navigates to /cv", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /open askaditya terminal/i }).click();
    const input = page.getByLabel("Terminal command input");
    await input.fill("cv");
    await input.press("Enter");
    await expect(page).toHaveURL(/\/cv$/, { timeout: 5000 });
  });

  test("free text degrades to the wired-up notice while unconfigured; Escape closes", async ({ page }) => {
    // No ANTHROPIC_API_KEY on the test server → the real route answers 503 "unconfigured".
    await page.goto("/");
    await page.getByRole("button", { name: /open askaditya terminal/i }).click();
    const input = page.getByLabel("Terminal command input");
    await input.fill("what do you charge?");
    await input.press("Enter");
    await expect(page.getByText(/AI mode is being wired up/)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });

  test("streams an AI answer into the terminal (mocked route)", async ({ page }) => {
    await page.route("**/api/chat", (route) =>
      route.fulfill({
        status: 200,
        contentType: "text/plain; charset=utf-8",
        body: "Aditya is a Tech Lead at MM Nova Tech with 9+ years shipping Laravel and AI products.",
      }),
    );
    await page.goto("/");
    await page.getByRole("button", { name: /open askaditya terminal/i }).click();
    const input = page.getByLabel("Terminal command input");
    await input.fill("who is aditya?");
    await input.press("Enter");
    await expect(
      page.getByRole("dialog").getByText(/Tech Lead at MM Nova Tech with 9\+ years/),
    ).toBeVisible();
  });

  test("shows the budget-cap notice when the spend gate trips (mocked route)", async ({ page }) => {
    await page.route("**/api/chat", (route) =>
      route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: "AI is resting (monthly budget cap).", reason: "budget" }),
      }),
    );
    await page.goto("/");
    await page.getByRole("button", { name: /open askaditya terminal/i }).click();
    const input = page.getByLabel("Terminal command input");
    await input.fill("tell me everything");
    await input.press("Enter");
    await expect(page.getByText(/AI is resting \(budget cap\)/)).toBeVisible();
  });

  test("shows the rate-limit notice on 429 (mocked route)", async ({ page }) => {
    await page.route("**/api/chat", (route) =>
      route.fulfill({
        status: 429,
        contentType: "application/json",
        body: JSON.stringify({ error: "Rate limit: 10 questions per hour.", reason: "rate" }),
      }),
    );
    await page.goto("/");
    await page.getByRole("button", { name: /open askaditya terminal/i }).click();
    const input = page.getByLabel("Terminal command input");
    await input.fill("question eleven");
    await input.press("Enter");
    await expect(page.getByText(/rate limit: 10 questions\/hour/)).toBeVisible();
  });

  test("suggestion chips show on boot, ask on click, and hide after input", async ({ page }) => {
    await page.route("**/api/chat", (route) =>
      route.fulfill({ status: 200, contentType: "text/plain", body: "PHP, Laravel, Vue, React, and LLM APIs." }),
    );
    await page.goto("/");
    await page.getByRole("button", { name: /open askaditya terminal/i }).click();
    const chip = page.getByRole("button", { name: "what's his stack?" });
    await expect(chip).toBeVisible();
    await chip.click();
    await expect(page.getByRole("dialog").getByText(/Laravel, Vue, React/)).toBeVisible();
    await expect(chip).not.toBeVisible(); // chips vanish once the conversation starts
  });

  test("sudo hire-aditya opens the booking page", async ({ page, context }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /open askaditya terminal/i }).click();
    const input = page.getByLabel("Terminal command input");
    const popupPromise = context.waitForEvent("page");
    await input.fill("sudo hire-aditya");
    await input.press("Enter");
    await expect(page.getByText(/permission granted/)).toBeVisible();
    const popup = await popupPromise;
    expect(popup.url()).toContain("cal.com");
  });
});
