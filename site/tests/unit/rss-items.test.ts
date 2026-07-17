import { describe, it, expect, vi } from "vitest";
import path from "node:path";

// Exercise the RSS <item> mapping against fixture posts — the plain rss test
// runs against the (empty) real content/posts and never renders an item.
vi.mock("@/lib/posts", async () => {
  const actual = await vi.importActual<typeof import("@/lib/posts")>("@/lib/posts");
  const FIXTURES = path.join(process.cwd(), "tests/fixtures/posts");
  return {
    ...actual,
    getAllPosts: () => actual.getAllPosts(FIXTURES),
  };
});

import { GET } from "@/app/blog/rss.xml/route";

describe("RSS <item> mapping (fixtures)", () => {
  it("renders escaped titles, canonical links, permalink guids, and pubDates", async () => {
    const body = await (await GET()).text();
    // Title with & and <> is escaped
    expect(body).toContain("&lt;angle brackets&gt; &amp; ampersands");
    // Self-canonical post links to the site
    expect(body).toContain("<link>https://adityadev.in/blog/building-the-thing</link>");
    // Legacy import: link AND guid both assert the Dev.to canonical — a
    // permalink guid must equal the link (adversarial finding: contradicting
    // them sends readers to a page whose canonical points elsewhere).
    expect(body).toContain("<link>https://dev.to/adityakdevin/legacy-post-abc</link>");
    expect(body).toContain(
      `<guid isPermaLink="true">https://dev.to/adityakdevin/legacy-post-abc</guid>`,
    );
    // Dates render as RFC-822 pubDate
    expect(body).toContain("<pubDate>Fri, 10 Jul 2026 00:00:00 GMT</pubDate>");
  });
});
