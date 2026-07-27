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

/** A slow Dev.to must not hold the homepage hostage until the platform timeout. */
const TIMEOUT_MS = 3_000;

/**
 * The `as DevtoPost[]` cast used to be a lie: a 200 with junk shape flowed
 * straight into mergeFieldNotes(), where `published_at.slice(0, 10)` throws and
 * takes the whole page down. Validate here - the ONE door every caller enters by.
 */
function isDevtoPost(p: unknown): p is DevtoPost {
  const o = p as Record<string, unknown> | null;
  return (
    typeof o?.id === "number" &&
    typeof o.title === "string" &&
    typeof o.url === "string" &&
    typeof o.published_at === "string" &&
    o.published_at.length >= 10
  );
}

/**
 * Failure contract (SPEC S5.6): a Dev.to outage must never fail a build
 * or render an empty section. On error, timeout, or malformed payload: last
 * successful payload; if none, null (section hides).
 */
export async function getLatestPosts(limit = 3): Promise<DevtoPost[] | null> {
  try {
    const res = await fetch(
      `https://dev.to/api/articles?username=${profile.devtoUsername}&per_page=${limit}`,
      { next: { revalidate: 86400 }, signal: AbortSignal.timeout(TIMEOUT_MS) }, // daily ISR
    );
    if (!res.ok) throw new Error(`dev.to ${res.status}`);
    const raw: unknown = await res.json();
    // Drop bad entries rather than failing the batch: one malformed article
    // shouldn't cost the reader the other two.
    const posts = Array.isArray(raw) ? raw.filter(isDevtoPost) : [];
    if (posts.length === 0) return lastGood; // no posts yet, or all junk → hide
    lastGood = posts.slice(0, limit);
    return lastGood;
  } catch {
    return lastGood; // stale-if-error; null hides the section
  }
}
