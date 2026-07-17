/**
 * Attribution + events (eng review D15).
 *
 * first_landing / referrer are stamped once per session (Attribution
 * component in the layout); the contact form sends them with each
 * submission so a lead can be traced to the post that earned it.
 * cal.com clicks need no JS here: links carry ?ref=<page> and GA4's
 * enhanced measurement tracks outbound clicks automatically.
 */

export const FIRST_LANDING_KEY = "first_landing";
export const REFERRER_KEY = "first_referrer";
export const REF_KEY = "first_ref";

// Social campaign token from ?ref=<platform> (e.g. li, x, ig). Kept short and
// path-safe so it survives the contact route's attr validator. Same regex must
// live on the server (route.ts) — keep them in sync.
const REF_RE = /^[a-z0-9][a-z0-9_-]{0,31}$/;

export function stampSession() {
  try {
    if (!sessionStorage.getItem(FIRST_LANDING_KEY)) {
      sessionStorage.setItem(FIRST_LANDING_KEY, location.pathname);
      const ref = document.referrer;
      // Hostname comparison, not substring — "https://evil.com/?adityadev.in"
      // must count as an external referrer.
      if (ref && new URL(ref).hostname !== location.hostname) {
        sessionStorage.setItem(REFERRER_KEY, ref);
      }
      // First-touch ?ref capture: the social link IS the landing page, so a
      // later same-session nav without ?ref must NOT overwrite it (that's why
      // this lives inside the first-landing gate). Validated here so junk never
      // reaches storage; validated again server-side.
      const campaign = new URLSearchParams(location.search ?? "").get("ref");
      if (campaign && REF_RE.test(campaign)) {
        sessionStorage.setItem(REF_KEY, campaign);
      }
    }
  } catch {
    // sessionStorage unavailable (privacy mode) — attribution degrades silently.
  }
}

export function getAttribution() {
  const source_page = typeof location !== "undefined" ? location.pathname : "";
  try {
    return {
      source_page,
      first_landing: sessionStorage.getItem(FIRST_LANDING_KEY) ?? "",
      referrer: sessionStorage.getItem(REFERRER_KEY) ?? "",
      ref: sessionStorage.getItem(REF_KEY) ?? "",
    };
  } catch {
    // Storage blocked (privacy mode) — keep the page, drop the session fields.
    return { source_page, first_landing: "", referrer: "", ref: "" };
  }
}

/**
 * GA4 event under either tag setup (red-team finding): direct gtag.js ignores
 * message-style dataLayer pushes — events must go through gtag('event', …).
 * GTM containers want the {event: …} push. Detect which one is loaded.
 */
export function track(event: string, params: Record<string, string> = {}) {
  try {
    const w = window as unknown as { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };
    if (typeof w.gtag === "function") {
      w.gtag("event", event, params);
      return;
    }
    w.dataLayer = w.dataLayer ?? [];
    w.dataLayer.push({ event, ...params });
  } catch {
    // analytics must never break the page
  }
}
