/**
 * Shared in-memory rate limiter (eng review D12 — extracted from
 * api/contact/route.ts so contact + subscribe share ONE implementation).
 *
 * ponytail: per-instance Map — Upstash lands with /api/chat's counters when
 * the account exists; a single Vercel instance covers current traffic. When
 * that day comes, this file is the only place to swap.
 *
 * D14: entries are pruned once the map grows past PRUNE_AT, so one-shot
 * scraper IPs can't grow memory unboundedly between instance recycles.
 */

type Entry = { count: number; reset: number };

const PRUNE_AT = 5000;

export function createRateLimiter(limit: number, windowMs: number) {
  const hits = new Map<string, Entry>();

  function prune(now: number) {
    if (hits.size < PRUNE_AT) return;
    for (const [key, entry] of hits) {
      if (now > entry.reset) hits.delete(key);
    }
    // Hard cap (adversarial finding): key rotation inside the window defeats
    // expiry-only pruning. Evict oldest-inserted (Map order) past the cap —
    // an attacker rotating keys evicts their own entries, not memory.
    if (hits.size >= PRUNE_AT) {
      const excess = hits.size - PRUNE_AT + 1;
      let i = 0;
      for (const key of hits.keys()) {
        if (i++ >= excess) break;
        hits.delete(key);
      }
    }
  }

  function rateLimited(key: string): boolean {
    const now = Date.now();
    prune(now);
    const entry = hits.get(key);
    if (!entry || now > entry.reset) {
      hits.set(key, { count: 1, reset: now + windowMs });
      return false;
    }
    entry.count += 1;
    return entry.count > limit;
  }
  // Observable for tests — the D14 sweep must be provably real, not vacuous.
  rateLimited.size = () => hits.size;
  return rateLimited;
}

/**
 * Client IP for rate-limit keys, shared by contact/subscribe/chat routes.
 * Prefers x-real-ip (platform-set on Vercel, not client-spoofable) over the
 * leftmost x-forwarded-for entry, which clients can prepend to behind proxies
 * that append rather than overwrite.
 * ponytail: the trust assumption is VERCEL-ONLY — behind any other proxy,
 * verify which header the edge actually controls before relying on this.
 */
export function clientIp(req: { headers: { get(name: string): string | null } }): string {
  return (
    req.headers.get("x-real-ip")?.trim() ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}
