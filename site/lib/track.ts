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
    };
  } catch {
    // Storage blocked (privacy mode) — keep the page, drop the session fields.
    return { source_page, first_landing: "", referrer: "" };
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
