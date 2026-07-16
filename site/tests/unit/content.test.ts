import { describe, it, expect, vi, afterEach } from "vitest";
import { profile } from "@/content/data/profile";
import { faq } from "@/content/data/faq";
import { personJsonLd, faqJsonLd, cvJsonLd } from "@/lib/jsonld";
import { getLatestPosts } from "@/lib/devto";

describe("profile.ts (single source of truth)", () => {
  it("has the identity facts every consumer needs", () => {
    expect(profile.name).toBe("Aditya Kumar");
    expect(profile.email).toContain("@adityadev.in");
    expect(profile.metrics.length).toBe(4);
    expect(profile.services.length).toBe(3);
    expect(profile.verify.length).toBeGreaterThanOrEqual(3);
  });

  it("never ships fake testimonials — slot is empty until real quotes exist", () => {
    for (const t of profile.testimonials) {
      expect(t.quote.length).toBeGreaterThan(20);
      expect(t.author).toBeTruthy();
    }
  });
});

describe("faq.ts", () => {
  it("has at least 5 substantive hire-intent Q&As", () => {
    expect(faq.length).toBeGreaterThanOrEqual(5);
    for (const item of faq) {
      expect(item.q.length).toBeGreaterThan(10);
      expect(item.a.length).toBeGreaterThan(80); // substantive, not thin (§5.7)
    }
  });
});

describe("jsonld.ts generators", () => {
  it("Person schema carries the shared @id and required fields", () => {
    const p = personJsonLd();
    expect(p["@type"]).toBe("Person");
    expect(p["@id"]).toBe("https://adityadev.in/#aditya");
    expect(p.name).toBe(profile.name);
    expect(p.sameAs).toContain(profile.github);
  });

  it("FAQPage mirrors faq.ts exactly (single-source invariant)", () => {
    const f = faqJsonLd();
    expect(f.mainEntity.length).toBe(faq.length);
    expect(f.mainEntity[0].name).toBe(faq[0].q);
    expect(f.mainEntity[0].acceptedAnswer.text).toBe(faq[0].a);
  });

  it("CV schema links back to the same Person @id", () => {
    const c = cvJsonLd();
    expect(c.mainEntity["@id"]).toBe("https://adityadev.in/#aditya");
  });
});

describe("devto.ts failure contract (§5.6)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("returns null (section hides) when the API fails and no last-good exists", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("dev.to down")));
    const posts = await getLatestPosts(3);
    expect(posts).toBeNull();
  });

  it("returns last-good payload after a later failure", async () => {
    const good = [
      { id: 1, title: "Post", url: "https://dev.to/x", published_at: "2026-01-01T00:00:00Z", description: "" },
    ];
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => good }),
    );
    expect(await getLatestPosts(3)).toEqual(good);

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("dev.to down again")));
    expect(await getLatestPosts(3)).toEqual(good); // stale-if-error
  });

  it("never throws on a non-ok response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 503 }));
    await expect(getLatestPosts(3)).resolves.not.toThrow();
  });
});
