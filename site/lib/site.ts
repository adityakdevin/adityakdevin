/** Single source for site-wide constants (eng ship review D3 - DRY). */

export const SITE_URL = "https://adityadev.in";

/** Shared client+server email shape check (contact + newsletter, both sides). */
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const EMAIL_MAX = 320;

/**
 * Append a `?ref=<token>` campaign tag to a URL, respecting any existing query
 * string (single source so booking-link attribution can't drift). Empty ref is
 * a no-op. Tokens are the same slugs `lib/track.ts` / the contact route accept.
 */
export function withRef(url: string, ref: string): string {
  if (!ref) return url;
  return `${url}${url.includes("?") ? "&" : "?"}ref=${ref}`;
}
