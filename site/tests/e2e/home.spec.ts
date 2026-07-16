import { test, expect } from "@playwright/test";

test.describe("homepage", () => {
  test("hero text is server-rendered (visible without JS)", async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto(baseURL!);
    await expect(page.getByRole("heading", { level: 1, name: "Aditya Kumar" })).toBeVisible();
    await expect(page.getByText("I build Laravel & AI products that ship.")).toBeVisible();
    await ctx.close();
  });

  test("primary CTA links to booking", async ({ page }) => {
    await page.goto("/");
    const cta = page.getByRole("link", { name: /book a call/i }).first();
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("href", /cal\.com/);
  });

  test("claim-shaped section headings are present (scan test)", async ({ page }) => {
    await page.goto("/");
    for (const heading of [
      "I ship AI features into production apps",
      "Proof: systems that run businesses",
      "Verify me yourself",
      "Before you book",
    ]) {
      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    }
  });

  test("JSON-LD Person + FAQPage schemas are embedded", async ({ page }) => {
    await page.goto("/");
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const types = scripts.map((s) => JSON.parse(s)["@type"]);
    expect(types).toContain("Person");
    expect(types).toContain("FAQPage");
    expect(types).toContain("ProfilePage");
  });

  test("theme toggle flips data-theme and persists", async ({ page }) => {
    await page.goto("/");
    // toggle lives in sticky header — scroll past hero to reveal it
    await page.mouse.wheel(0, 2000);
    await page.waitForTimeout(300);
    const initial = await page.evaluate(() => document.documentElement.dataset.theme);
    await page.getByRole("button", { name: /switch to/i }).first().click();
    const flipped = await page.evaluate(() => document.documentElement.dataset.theme);
    expect(flipped).not.toBe(initial);
    await page.reload();
    const persisted = await page.evaluate(() => document.documentElement.dataset.theme);
    expect(persisted).toBe(flipped);
  });

  test("FAQ answers expand", async ({ page }) => {
    await page.goto("/");
    const q = page.getByText("Do you work with international clients?");
    await q.scrollIntoViewIfNeeded();
    await q.click();
    await expect(page.getByText(/US-morning and full EU hours/)).toBeVisible();
  });
});

test.describe("contact form states (§5A)", () => {
  test("inline validation on blur, then mocked success panel", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("email *").scrollIntoViewIfNeeded();
    await page.getByLabel("email *").fill("not-an-email");
    await page.getByLabel("email *").blur();
    await expect(page.getByText("Please enter a valid email address.")).toBeVisible();

    await page.route("**/api/contact", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' }),
    );
    await page.getByLabel("name *").fill("Playwright Test");
    await page.getByLabel("email *").fill("test@example.com");
    await page.getByLabel(/what are you building/i).fill("A test message long enough to pass.");
    await page.getByRole("button", { name: /send message/i }).click();
    await expect(page.getByText(/I reply within 24 hours/)).toBeVisible();
  });

  test("API failure shows retry message with direct email fallback", async ({ page }) => {
    await page.goto("/");
    await page.route("**/api/contact", (route) => route.fulfill({ status: 502, body: "{}" }));
    await page.getByLabel("name *").fill("Playwright Test");
    await page.getByLabel("email *").fill("test@example.com");
    await page.getByLabel(/what are you building/i).fill("A test message long enough to pass.");
    await page.getByRole("button", { name: /send message/i }).click();
    await expect(page.getByText(/Couldn't send/)).toBeVisible();
    await expect(page.getByRole("alert").getByRole("link", { name: /contact@adityadev\.in/ })).toBeVisible();
  });
});

test.describe("responsive §5B", () => {
  test("mobile shows bottom tab bar; desktop shows sticky header after scroll", async ({
    page,
    isMobile,
  }) => {
    await page.goto("/");
    if (isMobile) {
      // tab bar is always visible — no scroll needed (native-app nav)
      const bar = page.locator("nav.md\\:hidden");
      await expect(bar).toBeVisible();
      await expect(bar.getByRole("link", { name: "work" })).toBeVisible();
      await expect(bar.getByRole("link", { name: /book/ })).toBeVisible();
    } else {
      await page.mouse.wheel(0, 3000);
      await page.waitForTimeout(300);
      await expect(page.getByRole("banner")).toBeVisible();
      await expect(page.getByRole("banner").getByText("adityakdevin")).toBeVisible();
    }
  });

  test("no horizontal scroll on any viewport", async ({ page }) => {
    await page.goto("/");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(overflow).toBe(false);
  });
});
