import { describe, it, expect } from "vitest";
import { mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { getAllPosts, getPost, canonicalUrl } from "@/lib/posts";
import { articleJsonLd } from "@/lib/jsonld";
import { escapeXml, GET as rssGet } from "@/app/blog/rss.xml/route";

const FIXTURES = path.join(process.cwd(), "tests/fixtures/posts");

function tmpPostsDir(files: Record<string, string>): string {
  const dir = mkdtempSync(path.join(tmpdir(), "posts-"));
  for (const [name, content] of Object.entries(files)) {
    writeFileSync(path.join(dir, name), content);
  }
  return dir;
}

describe("lib/posts.ts loader", () => {
  it("parses posts newest-first with required and optional fields", () => {
    const posts = getAllPosts(FIXTURES);
    expect(posts.map((p) => p.slug)).toEqual(["building-the-thing", "legacy-import"]);
    const [walkthrough, legacy] = posts;
    expect(walkthrough.title).toContain("Building the thing");
    expect(walkthrough.client).toBe("Acme Logistics");
    expect(walkthrough.devtoId).toBeUndefined(); // legal pre-syndication state
    expect(walkthrough.canonical).toBeUndefined();
    expect(legacy.devtoId).toBe(123456);
    expect(legacy.canonical).toContain("dev.to");
    expect(walkthrough.content).toContain("## The problem");
  });

  it("returns [] for a missing or empty directory (index renders empty state)", () => {
    expect(getAllPosts("/nonexistent/never")).toEqual([]);
    expect(getAllPosts(tmpPostsDir({}))).toEqual([]);
  });

  it("throws loudly naming file and field when required frontmatter is missing", () => {
    const dir = tmpPostsDir({
      "broken.mdx": `---\ntitle: "Has title"\ndate: "2026-07-01"\ntags: ["x"]\n---\nbody`,
    });
    expect(() => getAllPosts(dir)).toThrow(/broken\.mdx.*description/);
  });

  it("throws on a malformed date", () => {
    const dir = tmpPostsDir({
      "bad-date.mdx": `---\ntitle: "T"\ndescription: "D"\ndate: "July 1"\ntags: ["x"]\n---\nbody`,
    });
    expect(() => getAllPosts(dir)).toThrow(/bad-date\.mdx.*yyyy-mm-dd/);
  });

  it("getPost returns the post or null", () => {
    expect(getPost("legacy-import", FIXTURES)?.title).toContain("Legacy");
    expect(getPost("nope", FIXTURES)).toBeNull();
  });
});

describe("canonical resolution", () => {
  it("is self-canonical from the slug by default", () => {
    const post = getPost("building-the-thing", FIXTURES)!;
    expect(canonicalUrl(post)).toBe("https://adityadev.in/blog/building-the-thing");
  });

  it("honors the legacy-import override", () => {
    const post = getPost("legacy-import", FIXTURES)!;
    expect(canonicalUrl(post)).toBe("https://dev.to/adityakdevin/legacy-post-abc");
  });
});

describe("Article JSON-LD", () => {
  it("emits a valid Article node wired into the shared @id graph", () => {
    const post = getPost("building-the-thing", FIXTURES)!;
    const ld = articleJsonLd(post);
    expect(ld["@type"]).toBe("Article");
    expect(ld["@id"]).toBe("https://adityadev.in/blog/building-the-thing#article");
    expect(ld.author).toEqual({ "@id": "https://adityadev.in/#aditya" });
    expect(ld.headline).toContain("Building the thing");
    expect(ld.datePublished).toBe("2026-07-10");
    expect(ld.url).toBe("https://adityadev.in/blog/building-the-thing");
    expect(() => JSON.stringify(ld)).not.toThrow();
  });

  it("points url at the canonical override for legacy imports", () => {
    const post = getPost("legacy-import", FIXTURES)!;
    expect(articleJsonLd(post).url).toBe("https://dev.to/adityakdevin/legacy-post-abc");
  });
});

describe("RSS", () => {
  it("escapes XML-hostile characters", () => {
    expect(escapeXml(`Tom & Jerry <script> "quotes" 'apos'`)).toBe(
      "Tom &amp; Jerry &lt;script&gt; &quot;quotes&quot; &apos;apos&apos;",
    );
  });

  it("serves a well-formed channel with the right content type", async () => {
    const res = await rssGet();
    expect(res.headers.get("Content-Type")).toContain("application/rss+xml");
    const body = await res.text();
    expect(body).toContain(`<?xml version="1.0" encoding="UTF-8"?>`);
    expect(body).toContain("<channel>");
    // No unescaped ampersands outside entities (well-formedness smoke check).
    expect(body).not.toMatch(/&(?!amp;|lt;|gt;|quot;|apos;)/);
  });
});

describe("homepage Field-notes merge (T5 regressions)", () => {
  const local = getAllPosts(FIXTURES); // legacy-import carries devtoId 123456
  const devtoFeed = [
    { id: 123456, title: "Legacy post (Dev.to copy)", url: "https://dev.to/x/legacy", published_at: "2026-01-05T00:00:00Z" },
    { id: 999, title: "Dev.to only post", url: "https://dev.to/x/only", published_at: "2026-06-01T00:00:00Z" },
  ];

  it("merges both sources, dedupes by devtoId, local copy wins, newest first", async () => {
    const { mergeFieldNotes } = await import("@/lib/posts");
    const notes = mergeFieldNotes(local, devtoFeed);
    expect(notes.map((n) => n.key)).toEqual([
      "local-building-the-thing", // 2026-07-10
      "devto-999", // 2026-06-01
      "local-legacy-import", // 2026-01-05 — API copy with id 123456 deduped away
    ]);
    expect(notes[0].href).toBe("/blog/building-the-thing");
    expect(notes[1].href).toBe("https://dev.to/x/only");
  });

  it("renders local posts even when Dev.to is down (§5.6 now legacy-only)", async () => {
    const { mergeFieldNotes } = await import("@/lib/posts");
    const notes = mergeFieldNotes(local, null);
    expect(notes.length).toBe(2);
    expect(notes.every((n) => n.key.startsWith("local-"))).toBe(true);
  });

  it("returns [] when both sources are empty (section hides)", async () => {
    const { mergeFieldNotes } = await import("@/lib/posts");
    expect(mergeFieldNotes([], null)).toEqual([]);
    expect(mergeFieldNotes([], [])).toEqual([]);
  });

  it("truncates to the limit, keeping the newest", async () => {
    const { mergeFieldNotes } = await import("@/lib/posts");
    const many = [
      ...devtoFeed,
      { id: 7, title: "Ancient post", url: "https://dev.to/x/old", published_at: "2020-01-01T00:00:00Z" },
    ];
    const notes = mergeFieldNotes(local, many); // 4 candidates, default limit 3
    expect(notes.length).toBe(3);
    expect(notes.map((n) => n.key)).not.toContain("devto-7"); // oldest dropped
    expect(mergeFieldNotes(local, many, 2).length).toBe(2);
  });
});

describe("prompt-corpus exclusion (§3 amendment)", () => {
  it("lib/prompt.ts never touches content/posts — the 15-25k token budget holds", () => {
    const src = readFileSync(path.join(process.cwd(), "lib/prompt.ts"), "utf-8");
    expect(src).not.toMatch(/content\/posts|lib\/posts|readdir/);
    const imports = src.match(/from "@\/[^"]+"/g) ?? [];
    for (const imp of imports) {
      expect(imp).toMatch(/@\/content\/data\//);
    }
  });
});
