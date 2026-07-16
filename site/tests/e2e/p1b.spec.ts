import { test, expect } from "@playwright/test";

test.describe("privacy page", () => {
  test("renders all data-practice sections and is linked from the footer", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.getByRole("heading", { name: /privacy, in plain language/i })).toBeVisible();
    for (const section of ["Analytics", "Contact form", "Booking", "Removal"]) {
      await expect(page.getByRole("heading", { name: section })).toBeVisible();
    }
    await page.goto("/");
    await expect(page.locator("footer").getByRole("link", { name: "Privacy" })).toHaveAttribute(
      "href",
      "/privacy",
    );
  });
});

test.describe("llms.txt + OG images", () => {
  test("llms.txt serves as plain text", async ({ request }) => {
    const res = await request.get("/llms.txt");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("text/plain");
    expect(await res.text()).toContain("Aditya Kumar");
  });

  test("home and cv OG images render as PNG", async ({ request }) => {
    for (const path of ["/opengraph-image", "/cv/opengraph-image"]) {
      const res = await request.get(path);
      expect(res.status()).toBe(200);
      expect(res.headers()["content-type"]).toContain("image/png");
      expect((await res.body()).length).toBeGreaterThan(5000);
    }
  });
});
