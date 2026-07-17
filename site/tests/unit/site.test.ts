import { describe, it, expect } from "vitest";
import { withRef } from "@/lib/site";

describe("lib/site withRef", () => {
  it("appends ?ref when the URL has no query string", () => {
    expect(withRef("https://cal.com/aditya", "contact")).toBe("https://cal.com/aditya?ref=contact");
  });

  it("appends &ref when the URL already has a query string", () => {
    expect(withRef("https://cal.com/aditya?x=1", "hero")).toBe("https://cal.com/aditya?x=1&ref=hero");
  });

  it("is a no-op for an empty ref", () => {
    expect(withRef("https://cal.com/aditya", "")).toBe("https://cal.com/aditya");
  });

  it("passes a slug-style ref through unchanged (matches track.ts / route.ts acceptors)", () => {
    expect(withRef("https://cal.com/aditya", "blog-building-x")).toBe(
      "https://cal.com/aditya?ref=blog-building-x",
    );
  });
});
