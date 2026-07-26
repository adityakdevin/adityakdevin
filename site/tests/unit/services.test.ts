import { describe, it, expect } from "vitest";
import { services, getService } from "@/content/data/services";
import { getAllPosts } from "@/lib/posts";
import { publishedCaseStudies } from "@/content/data/work";

describe("service pages", () => {
  it("keeps the three legacy URLs (the refactor must not move them)", () => {
    expect(services.map((s) => s.slug)).toEqual([
      "laravel-ai-development",
      "nodejs-ai-development",
      "python-ai-development",
    ]);
    for (const s of services) expect(getService(s.slug)).toBeDefined();
  });

  // The exact bug class that let "case studies with named clients and real
  // numbers" point at a solo CRUD app on all three pages for weeks: a proof
  // link nobody re-checked after the destination changed.
  it("every proof link resolves to a real post or published case study", () => {
    const slugs = new Set([
      ...getAllPosts().map((p) => `/blog/${p.slug}`),
      ...publishedCaseStudies.map((c) => `/work/${c.slug}`),
    ]);
    for (const s of services) {
      expect(s.proof.length, `${s.slug} has no proof`).toBeGreaterThan(0);
      for (const p of s.proof) {
        expect(slugs.has(p.href), `${s.slug} -> ${p.href}`).toBe(true);
      }
    }
  });

  it("every page disqualifies someone", () => {
    for (const s of services) {
      expect(s.goodFit.length, s.slug).toBeGreaterThan(0);
      expect(s.notFit.length, s.slug).toBeGreaterThan(0);
    }
  });

  it("each page carries its own booking ref token", () => {
    const refs = services.map((s) => s.ref);
    expect(new Set(refs).size).toBe(refs.length);
  });
});
