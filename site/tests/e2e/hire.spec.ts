import { test, expect } from "@playwright/test";

// /hire ships at sitemap priority 0.9 and had zero tests while four phases of
// the upgrade plan rewrite it. This is the floor: it loads, it says what it is,
// the booking CTA is attributed, and the form that catches non-callers renders.
test.describe("/hire", () => {
  test("loads with its wedge, an attributed booking CTA, and the contact form", async ({ page }) => {
    const res = await page.goto("/hire");
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1, name: "Hire me" })).toBeVisible();

    // Scoped to main: the sticky chrome carries its own booking CTA at ?ref=nav.
    const cta = page.getByRole("main").getByRole("link", { name: /book a call/i }).first();
    expect(await cta.getAttribute("href")).toContain("?ref=hire");

    await expect(page.getByRole("heading", { name: "Send the project details" })).toBeVisible();
    await expect(page.getByLabel(/name/i).first()).toBeVisible();
  });

  test("cross-links every service page (the cluster's only inbound links)", async ({ page }) => {
    await page.goto("/hire");
    for (const href of [
      "/services/laravel-ai-development",
      "/services/nodejs-ai-development",
      "/services/python-ai-development",
    ]) {
      await expect(page.locator(`a[href="${href}"]`).first()).toBeVisible();
    }
  });

  test("the marketplace exits sit below the contact form, not above it", async ({ page }) => {
    await page.goto("/hire");
    const formY = await page
      .getByRole("heading", { name: "Send the project details" })
      .evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
    const channelsY = await page
      .getByRole("heading", { name: "Where to hire me" })
      .evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
    expect(channelsY).toBeGreaterThan(formY);
  });
});
