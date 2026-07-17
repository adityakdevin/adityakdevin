/** Single source for site-wide constants (eng ship review D3 — DRY). */

export const SITE_URL = "https://adityadev.in";

/** Shared client+server email shape check (contact + newsletter, both sides). */
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const EMAIL_MAX = 320;
