import { readdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { SITE_URL } from "@/lib/site";


// POSTS_DIR env override exists for E2E runs (playwright.config.ts points it
// at tests/fixtures/posts so post-page flows execute before real posts ship).
const POSTS_DIR = process.env.POSTS_DIR
  ? path.resolve(process.env.POSTS_DIR)
  : path.join(process.cwd(), "content/posts");

/** Single source for the blog's positioning line (index copy, metadata, RSS). */
export const BLOG_DESCRIPTION =
  "End-to-end build walkthroughs, Laravel + AI integration notes, and real client case studies.";

/**
 * Blog post frontmatter contract (design doc 20260717, eng review):
 *
 *   content/posts/*.mdx ──┬─→ /blog/[slug]  (canonical)
 *                         ├─→ sitemap.ts, rss.xml
 *                         ├─→ Article JSON-LD
 *                         └─→ /draft-devto-post → Dev.to (canonical_url ↩)
 *
 * Required: title, description, date, tags.
 * Optional: devtoId  - written back AFTER Dev.to syndication (step 3 of the
 *                      publishing sequence), so absence is legal.
 *           canonical - OVERRIDE for imported legacy posts where Dev.to stays
 *                      canonical; omitted = self-canonical from the slug.
 *           client    - named client for case-study posts (permission on file).
 *
 * NOTE: this content is deliberately EXCLUDED from lib/prompt.ts (S3
 * amendment - 15-25k token cache budget). See tests/unit/posts.test.ts.
 */
export type Post = {
  slug: string;
  title: string;
  description: string;
  date: string; // ISO yyyy-mm-dd
  tags: string[];
  devtoId?: number;
  canonical?: string;
  client?: string;
  content: string;
};

const REQUIRED = ["title", "description", "date", "tags"] as const;

function parsePost(file: string, dir: string): Post {
  const slug = file.replace(/\.mdx$/, "");
  const raw = readFileSync(path.join(dir, file), "utf-8");
  const { data, content } = matter(raw);

  for (const field of REQUIRED) {
    const v = data[field];
    if (v === undefined || v === null || (Array.isArray(v) ? v.length === 0 : String(v).trim() === "")) {
      // Build fails loudly - a silently skipped post never ships broken.
      throw new Error(`content/posts/${file}: missing required frontmatter field "${field}"`);
    }
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(data.date))) {
    throw new Error(`content/posts/${file}: date must be yyyy-mm-dd, got "${data.date}"`);
  }
  // Calendar validation (adversarial finding): "2026-02-31" passes the regex
  // but rolls over in Date - RSS pubDate and the page would disagree.
  const parsed = new Date(`${data.date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== String(data.date)) {
    throw new Error(`content/posts/${file}: "${data.date}" is not a real calendar date`);
  }
  if (!Array.isArray(data.tags)) {
    throw new Error(`content/posts/${file}: tags must be a YAML list`);
  }
  if (data.devtoId !== undefined && !Number.isInteger(Number(data.devtoId))) {
    // A NaN devtoId silently breaks the homepage dedupe - the syndicated copy
    // would render twice.
    throw new Error(`content/posts/${file}: devtoId must be an integer`);
  }

  return {
    slug,
    title: String(data.title),
    description: String(data.description),
    date: String(data.date),
    tags: (data.tags as unknown[]).map(String),
    ...(data.devtoId !== undefined ? { devtoId: Number(data.devtoId) } : {}),
    ...(data.canonical ? { canonical: String(data.canonical) } : {}),
    ...(data.client ? { client: String(data.client) } : {}),
    content,
  };
}

let defaultDirCache: Post[] | undefined;

/** All posts, newest first. Missing/empty dir → [] (index renders empty state).
 *  The default dir is memoized - posts are immutable within a build/server
 *  process, and getPost is called per slug per render (metadata + page + OG). */
export function getAllPosts(dir: string = POSTS_DIR): Post[] {
  if (dir === POSTS_DIR && defaultDirCache) return defaultDirCache;
  if (!existsSync(dir)) return [];
  const posts = readdirSync(dir)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => parsePost(f, dir))
    // Total order: date desc, slug as tiebreak - same-day posts must sort
    // deterministically across builds (a bare `<` comparator isn't symmetric).
    .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
  if (dir === POSTS_DIR) defaultDirCache = posts;
  return posts;
}

export function getPost(slug: string, dir: string = POSTS_DIR): Post | null {
  return getAllPosts(dir).find((p) => p.slug === slug) ?? null;
}

/** Self-canonical from the slug unless a legacy-import override is set. */
export function canonicalUrl(post: Post): string {
  return post.canonical ?? `${SITE_URL}/blog/${post.slug}`;
}

export type FieldNote = { key: string; date: string; title: string; href: string };

/**
 * Homepage "Field notes" merge (design doc 20260717 / eng review T5):
 * local site-first posts + the Dev.to legacy feed, deduped by devtoId -
 * a syndicated copy never appears twice, and the LOCAL copy wins (its page
 * is the canonical home). The S5.6 failure contract now applies only to the
 * legacy half: Dev.to down → local posts still render; both empty → the
 * section hides.
 */
export function mergeFieldNotes(
  local: Post[],
  legacy: { id: number; title: string; url: string; published_at: string }[] | null,
  limit = 3,
): FieldNote[] {
  const syndicated = new Set(local.map((p) => p.devtoId).filter(Boolean));
  const localNotes: FieldNote[] = local.map((p) => ({
    key: `local-${p.slug}`,
    date: p.date,
    title: p.title,
    href: `/blog/${p.slug}`,
  }));
  const legacyNotes: FieldNote[] = (legacy ?? [])
    .filter((p) => !syndicated.has(p.id))
    .map((p) => ({
      key: `devto-${p.id}`,
      date: p.published_at.slice(0, 10),
      title: p.title,
      href: p.url,
    }));
  return [...localNotes, ...legacyNotes]
    .sort((a, b) => b.date.localeCompare(a.date) || a.key.localeCompare(b.key))
    .slice(0, limit);
}
