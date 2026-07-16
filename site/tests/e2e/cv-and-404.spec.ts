import { test, expect } from "@playwright/test";

test.describe("/cv", () => {
  test("renders data-driven CV with standard ATS sections", async ({ page }) => {
    await page.goto("/cv");
    await expect(page.getByRole("heading", { level: 1, name: "Aditya Kumar" })).toBeVisible();
    for (const section of ["Summary", "Experience", "Skills", "Education"]) {
      await expect(page.getByRole("heading", { name: section })).toBeVisible();
    }
  });

  test("print stylesheet hides chrome and flips to light (§8)", async ({ page }) => {
    await page.goto("/cv");
    await page.emulateMedia({ media: "print" });
    // Download button and sticky chrome are data-no-print
    await expect(page.getByRole("button", { name: /download pdf/i })).toBeHidden();
    const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bodyBg).toBe("rgb(255, 255, 255)");
  });
});

test.describe("404", () => {
  test("unknown route shows the terminal joke with working links", async ({ page }) => {
    await page.goto("/definitely-not-a-page");
    await expect(page.getByText(/command not found/)).toBeVisible();
    await page.getByRole("link", { name: "./cv" }).click();
    await expect(page).toHaveURL(/\/cv$/);
  });
});
