import { test, expect } from "@playwright/test";

test.describe("blog index", () => {
  test("renders heading, and either the post list or the empty state", async ({ page }) => {
    await page.goto("/blog");
    await expect(page.getByRole("heading", { name: "Field notes" })).toBeVisible();
    const items = page.locator("main ul li");
    if ((await items.count()) === 0) {
      await expect(page.getByText(/first posts landing soon/i)).toBeVisible();
    } else {
      await expect(items.first().getByRole("link")).toBeVisible();
    }
  });

  test("unknown slug returns 404", async ({ page }) => {
    const res = await page.goto("/blog/this-post-does-not-exist");
    expect(res?.status()).toBe(404);
  });

  test("rss.xml serves well-formed RSS", async ({ request }) => {
    const res = await request.get("/blog/rss.xml");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("application/rss+xml");
    const body = await res.text();
    expect(body).toContain("<rss");
    expect(body).toContain("<channel>");
  });
});

test.describe("post page → CTA flow (runs when posts exist)", () => {
  test("index → post → book-a-call CTA carries ?ref= attribution", async ({ page }) => {
    await page.goto("/blog");
    const first = page.locator("main ul li a").first();
    test.skip((await first.count()) === 0, "no posts published yet - covered by empty-state test");
    await first.click();
    await expect(page.locator("article.prose-post")).toBeVisible();
    // The sticky header carries its own "Book a call" - scope to the post body.
    const cta = page.getByRole("main").getByRole("link", { name: /book a call/i });
    await expect(cta).toBeVisible();
    expect(await cta.getAttribute("href")).toMatch(/\?ref=blog-/);
    await expect(page.getByRole("link", { name: /build something like this/i })).toHaveAttribute(
      "href",
      "/#contact",
    );
  });

  test("post page never scrolls horizontally on mobile (long-slug eyebrow regression)", async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, "horizontal-overflow bug is a small-viewport failure mode");
    await page.goto("/blog");
    const links = page.locator("main ul li a");
    test.skip((await links.count()) === 0, "no posts published yet");
    // Longest slug is the one that overflows first - target it specifically.
    const hrefs = await links.evaluateAll((as) => as.map((a) => a.getAttribute("href") ?? ""));
    await page.goto(hrefs.reduce((a, b) => (b.length > a.length ? b : a)));
    await expect(page.locator("article.prose-post")).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
});

test.describe("newsletter form UX", () => {
  test("happy path shows the success panel and keeps the honeypot wired", async ({ page }) => {
    let sent: Record<string, string> | null = null;
    await page.route("**/api/subscribe", (route) => {
      sent = route.request().postDataJSON();
      return route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' });
    });
    await page.goto("/blog");
    await page.getByLabel("Email address").fill("reader@example.com");
    await page.getByRole("button", { name: "Subscribe" }).click();
    await expect(page.getByText(/check your inbox to confirm/i)).toBeVisible();
    // Client/server honeypot field-name coupling: renaming either side would
    // silently kill the bot filter - pin the contract here.
    expect(sent!.email).toBe("reader@example.com");
    expect(sent!.website).toBe("");
  });

  test("invalid email shows an inline, recoverable error without a request", async ({ page }) => {
    let called = false;
    await page.route("**/api/subscribe", (route) => {
      called = true;
      return route.fulfill({ status: 200, body: '{"ok":true}' });
    });
    await page.goto("/blog");
    await page.getByLabel("Email address").fill("not-an-email");
    await page.getByRole("button", { name: "Subscribe" }).click();
    await expect(page.getByText(/valid email address/i)).toBeVisible();
    expect(called).toBe(false);
    // Recoverable: fix the input and succeed.
    await page.getByLabel("Email address").fill("reader@example.com");
    await page.getByRole("button", { name: "Subscribe" }).click();
    await expect(page.getByText(/check your inbox to confirm/i)).toBeVisible();
  });

  test("double-click fires a single subscription request", async ({ page }) => {
    let calls = 0;
    await page.route("**/api/subscribe", async (route) => {
      calls++;
      await new Promise((r) => setTimeout(r, 300)); // slow API - window for a double submit
      return route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' });
    });
    await page.goto("/blog");
    await page.getByLabel("Email address").fill("reader@example.com");
    const button = page.getByRole("button", { name: /subscrib/i });
    await button.click();
    await button.click({ force: true }).catch(() => {}); // second click lands on the disabled button
    await expect(page.getByText(/check your inbox to confirm/i)).toBeVisible();
    expect(calls).toBe(1);
  });

  test("provider failure shows a clear retry message with direct-email fallback", async ({
    page,
  }) => {
    await page.route("**/api/subscribe", (route) =>
      route.fulfill({ status: 502, contentType: "application/json", body: '{"error":"x"}' }),
    );
    await page.goto("/blog");
    await page.getByLabel("Email address").fill("reader@example.com");
    await page.getByRole("button", { name: "Subscribe" }).click();
    // Next's route announcer is also role=alert - scope to the form.
    const alert = page.locator('form[aria-label="Newsletter signup"]').getByRole("alert");
    await expect(alert).toBeVisible();
    await expect(alert).toContainText(/try again/i);
    await expect(alert.getByRole("link")).toHaveAttribute("href", /^mailto:/);
  });
});

test.describe("attribution (D15)", () => {
  test("contact submission carries first_landing from the entry page", async ({ page }) => {
    let sentBody: Record<string, string> | null = null;
    await page.route("**/api/contact", (route) => {
      sentBody = route.request().postDataJSON();
      return route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' });
    });
    // Land on /blog first - that's the page that "earned" the visit.
    await page.goto("/blog");
    await page.goto("/#contact");
    await page.getByLabel(/name \*/i).fill("E2E Visitor");
    await page.getByLabel(/email \*/i).fill("visitor@example.com");
    await page.getByLabel(/what are you building/i).fill("A Laravel AI thing, at least ten chars.");
    await page.getByRole("button", { name: /send message/i }).click();
    await expect(page.getByText(/got it - i reply within 24 hours/i)).toBeVisible();
    expect(sentBody).not.toBeNull();
    expect(sentBody!.first_landing).toBe("/blog");
    expect(sentBody!.source_page).toBe("/");
  });
});

test.describe("service page", () => {
  test("renders with Service JSON-LD and an attributed booking CTA", async ({ page }) => {
    await page.goto("/services/laravel-ai-development");
    await expect(
      page.getByRole("heading", { name: /laravel ai integration, by a named engineer/i }),
    ).toBeVisible();
    const cta = page.getByRole("link", { name: /book the 30-minute call/i });
    expect(await cta.getAttribute("href")).toContain("?ref=services-laravel-ai");
    const jsonLd = await page.locator('script[type="application/ld+json"]').first().textContent();
    expect(JSON.parse(jsonLd!)["@type"]).toBe("Service");
  });
});

test.describe("regressions", () => {
  test("sitemap keeps all six pre-blog entries and gains the service page", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    const body = await res.text();
    for (const path of [
      "",
      "/cv",
      "/privacy",
      "/now",
      "/uses",
      "/work/budgetgen",
      "/services/laravel-ai-development",
    ]) {
      expect(body).toContain(`<loc>https://adityadev.in${path}</loc>`);
    }
  });

  test("homepage Field-notes section links home, not to dev.to (T5 rewrite)", async ({ page }) => {
    await page.goto("/");
    const section = page.getByRole("heading", { name: /field notes from laravel \+ ai work/i });
    // Section renders only when local posts or the build-time Dev.to fetch
    // produced items - with neither, hiding IS the S5.6 contract.
    test.skip(
      (await section.count()) === 0,
      "Field notes hidden - no local posts and Dev.to unavailable at build",
    );
    await expect(page.getByRole("link", { name: /all field notes/i })).toHaveAttribute(
      "href",
      "/blog",
    );
  });

  test("privacy page covers newsletter data", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.getByRole("heading", { name: "Newsletter" })).toBeVisible();
    await expect(page.getByText(/Buttondown/)).toBeVisible();
  });
});
