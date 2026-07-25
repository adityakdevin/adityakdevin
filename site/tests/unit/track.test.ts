import { describe, it, expect, vi, afterEach } from "vitest";
import { track, getAttribution, stampSession, FIRST_LANDING_KEY, REFERRER_KEY, REF_KEY } from "@/lib/track";

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubBrowser(opts: { pathname?: string; search?: string; referrer?: string; store?: Map<string, string> }) {
  const store = opts.store ?? new Map<string, string>();
  vi.stubGlobal("location", { pathname: opts.pathname ?? "/", search: opts.search ?? "", hostname: "adityadev.in" });
  vi.stubGlobal("document", { referrer: opts.referrer ?? "" });
  vi.stubGlobal("sessionStorage", {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
  });
  return store;
}

describe("lib/track.ts (D15)", () => {
  it("track() pushes GTM-style events onto the dataLayer when no gtag exists", () => {
    const w: { dataLayer?: unknown[] } = {};
    vi.stubGlobal("window", w);
    track("contact_submit", { first_landing: "/blog/x" });
    expect(w.dataLayer).toEqual([{ event: "contact_submit", first_landing: "/blog/x" }]);
  });

  it("track() routes through gtag('event', ...) on the direct-GA4 path (red-team fix)", () => {
    const gtag = vi.fn();
    vi.stubGlobal("window", { gtag, dataLayer: [] });
    track("contact_submit", { first_landing: "/blog/x" });
    expect(gtag).toHaveBeenCalledWith("event", "contact_submit", { first_landing: "/blog/x" });
  });

  it("stampSession records the external referrer, and only stamps once", () => {
    const store = stubBrowser({ pathname: "/blog/post-a", referrer: "https://google.com/search" });
    stampSession();
    expect(store.get(FIRST_LANDING_KEY)).toBe("/blog/post-a");
    expect(store.get(REFERRER_KEY)).toBe("https://google.com/search");
    // Second navigation must NOT overwrite the first landing.
    vi.stubGlobal("location", { pathname: "/", hostname: "adityadev.in" });
    stampSession();
    expect(store.get(FIRST_LANDING_KEY)).toBe("/blog/post-a");
  });

  it("stampSession ignores same-host referrers", () => {
    const store = stubBrowser({ referrer: "https://adityadev.in/cv" });
    stampSession();
    expect(store.get(REFERRER_KEY)).toBeUndefined();
  });

  it("stampSession captures the ?ref campaign token first-touch, and getAttribution returns it", () => {
    const store = stubBrowser({ pathname: "/blog/post-a", search: "?ref=li" });
    stampSession();
    expect(store.get(REF_KEY)).toBe("li");
    expect(getAttribution().ref).toBe("li");
  });

  it("?ref is first-touch: a later same-session nav without ?ref does not clear it", () => {
    const store = stubBrowser({ pathname: "/blog/post-a", search: "?ref=x" });
    stampSession();
    // Second navigation, no ?ref - first landing is set, so nothing re-stamps.
    vi.stubGlobal("location", { pathname: "/contact", search: "", hostname: "adityadev.in" });
    stampSession();
    expect(store.get(REF_KEY)).toBe("x");
  });

  it("ignores a malformed ?ref (spaces, punctuation, over-length) - junk never reaches storage", () => {
    const store = stubBrowser({ pathname: "/", search: "?ref=li%20li!" });
    stampSession();
    expect(store.get(REF_KEY)).toBeUndefined();
    expect(getAttribution().ref).toBe("");
  });

  it("degrades silently when storage is unavailable (privacy mode)", () => {
    vi.stubGlobal("location", { pathname: "/", hostname: "adityadev.in" });
    vi.stubGlobal("document", { referrer: "" });
    vi.stubGlobal("sessionStorage", {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    });
    expect(() => stampSession()).not.toThrow();
    expect(getAttribution()).toEqual({ source_page: "/", first_landing: "", referrer: "", ref: "" });
  });

  it("S1.0 regression: a contact_submit event carries first_ref, not just first_landing", () => {
    // The bug this guards: ContactForm passed ONLY first_landing, so the ?ref
    // token was captured into sessionStorage on every social visit and then
    // dropped one line before analytics. GA4 never saw a single value, which made
    // "which channel produced this lead" unanswerable from data.
    const store = stubBrowser({ pathname: "/blog/x", search: "?ref=li" });
    stampSession();
    const attribution = getAttribution();
    expect(attribution.ref).toBe("li");

    const dataLayer: unknown[] = [];
    vi.stubGlobal("window", { dataLayer });
    track("contact_submit", { first_landing: attribution.first_landing, first_ref: attribution.ref });

    expect(dataLayer).toHaveLength(1);
    expect(dataLayer[0]).toMatchObject({ event: "contact_submit", first_ref: "li" });
    // And the raw external referrer must NOT be along for the ride.
    expect(dataLayer[0]).not.toHaveProperty("referrer");
    expect(store.get(REF_KEY)).toBe("li");
  });
});
