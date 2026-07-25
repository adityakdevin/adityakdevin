import { describe, it, expect } from "vitest";
import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { atomProblems, renderAtom, buildDraftMdx, isDraft, countAtoms, appendAtom } from "@/lib/atoms";
import { getAllPosts, getAllPostsIncludingDrafts, getPost } from "@/lib/posts";

const ATOM = {
  claim: "18k -> 4k tokens by scoping the file globs",
  failureMode: "scope too tight and you drop the file the answer was in",
  verification: "run it twice, diff the token count in the status line",
  date: "2026-07-25",
};

function fixtureDir(files: Record<string, string>) {
  const dir = mkdtempSync(path.join(tmpdir(), "posts-"));
  mkdirSync(dir, { recursive: true });
  for (const [name, body] of Object.entries(files)) writeFileSync(path.join(dir, name), body);
  return dir;
}

const post = (slug: string, extra = "") =>
  ['---', `title: "${slug}"`, 'description: "d"', 'date: "2026-07-20"', 'tags: ["AI"]', extra, "---", "", "## Body"]
    .filter(Boolean)
    .join("\n");

describe("lib/atoms.ts - atom validation", () => {
  it("accepts a complete atom", () => {
    expect(atomProblems(ATOM)).toEqual([]);
  });

  it("requires a NUMBER in the claim, not just a claim", () => {
    const p = atomProblems({ ...ATOM, claim: "uses way fewer tokens" });
    expect(p).toHaveLength(1);
    expect(p[0]).toMatch(/no number in it/);
  });

  it("names each missing field", () => {
    const p = atomProblems({ claim: "cut 18k tokens", date: "2026-07-25" });
    expect(p).toContain("failureMode is missing");
    expect(p).toContain("verification is missing");
  });
});

describe("lib/atoms.ts - draft construction", () => {
  it("ALWAYS writes published: false - a caller cannot omit it into existence", () => {
    const mdx = buildDraftMdx({
      slug: "token-tricks",
      title: "Token tricks",
      description: "d",
      date: "2026-07-25",
      tags: ["AI", "Claude"],
    });
    expect(mdx).toContain("published: false");
    expect(isDraft(mdx)).toBe(true);
  });

  it("appends an atom and counts it", () => {
    let mdx = buildDraftMdx({ slug: "s", title: "T", description: "d", date: "2026-07-25", tags: ["AI"] });
    expect(countAtoms(mdx)).toBe(0);
    mdx = appendAtom(mdx, ATOM);
    mdx = appendAtom(mdx, { ...ATOM, claim: "cut 3 rounds to 1 by batching the tool calls" });
    expect(countAtoms(mdx)).toBe(2);
    expect(mdx).toContain("Where it breaks:");
    expect(mdx).toContain("Check it in 10 seconds:");
  });

  it("refuses an incomplete atom rather than writing a half one", () => {
    const mdx = buildDraftMdx({ slug: "s", title: "T", description: "d", date: "2026-07-25", tags: ["AI"] });
    expect(() => appendAtom(mdx, { ...ATOM, verification: "" })).toThrow(/verification is missing/);
  });

  it("REFUSES to append to a published post", () => {
    // Appending raw notes to a live article would push unreviewed text onto the
    // site and into RSS in one step.
    const published = post("already-live");
    expect(isDraft(published)).toBe(false);
    expect(() => appendAtom(published, ATOM)).toThrow(/refusing to append to a PUBLISHED post/);
  });

  it("renderAtom carries the shipped-on marker", () => {
    expect(renderAtom({ ...ATOM, source: "x-thread" })).toMatch(/<!-- atom: 2026-07-25 \| shipped as x-thread -->/);
  });
});

describe("lib/posts.ts - the publication gate (safety filter)", () => {
  it("hides published: false from getAllPosts, and getPost cannot reach it", () => {
    const dir = fixtureDir({
      "live.mdx": post("live"),
      "draft.mdx": post("draft", "published: false"),
    });
    expect(getAllPosts(dir).map((p) => p.slug)).toEqual(["live"]);
    // getPost reads through getAllPosts, so the per-slug route 404s too. This is
    // the generateStaticParams leak: gating only the index still renders the page.
    expect(getPost("draft", dir)).toBeNull();
    expect(getPost("live", dir)).not.toBeNull();
  });

  it("still exposes drafts to tooling that explicitly asks", () => {
    const dir = fixtureDir({ "live.mdx": post("live"), "draft.mdx": post("draft", "published: false") });
    expect(getAllPostsIncludingDrafts(dir).map((p) => p.slug).sort()).toEqual(["draft", "live"]);
  });

  it("defaults to published so existing posts need no migration", () => {
    const dir = fixtureDir({ "a.mdx": post("a"), "b.mdx": post("b", "published: true") });
    expect(getAllPosts(dir)).toHaveLength(2);
  });

  it("rejects a STRING published value rather than coercing it", () => {
    // `published: "false"` is truthy. Silently treating it as published is how a
    // draft ships; this is a safety gate, so it fails loudly.
    const dir = fixtureDir({ "s.mdx": post("s", 'published: "false"') });
    expect(() => getAllPosts(dir)).toThrow(/published must be a boolean/);
  });

  it("a draft is absent from the sitemap and the RSS feed", () => {
    // Both read through getAllPosts, which is the whole point of gating there:
    // one filter, and every surface inherits it.
    const dir = fixtureDir({ "live.mdx": post("live"), "draft.mdx": post("draft", "published: false") });
    const slugs = getAllPosts(dir).map((p) => p.slug);
    expect(slugs).not.toContain("draft");
    expect(slugs).toContain("live");
  });
});
