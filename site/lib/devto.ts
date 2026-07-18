import { profile } from "@/content/data/profile";

export type DevtoPost = {
  id: number;
  title: string;
  url: string;
  published_at: string;
  description: string;
};

/** Module-level last-good cache: survives ISR revalidations within a server instance. */
let lastGood: DevtoPost[] | null = null;

/**
 * Failure contract (SPEC S5.6): a Dev.to outage must never fail a build
 * or render an empty section. On error: last successful payload; if none, null (section hides).
 */
export async function getLatestPosts(limit = 3): Promise<DevtoPost[] | null> {
  try {
    const res = await fetch(
      `https://dev.to/api/articles?username=${profile.devtoUsername}&per_page=${limit}`,
      { next: { revalidate: 86400 } }, // daily ISR
    );
    if (!res.ok) throw new Error(`dev.to ${res.status}`);
    const posts = (await res.json()) as DevtoPost[];
    if (!Array.isArray(posts) || posts.length === 0) return lastGood; // no posts yet → hide
    lastGood = posts.slice(0, limit);
    return lastGood;
  } catch {
    return lastGood; // stale-if-error; null hides the section
  }
}
