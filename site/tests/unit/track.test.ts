import { describe, it, expect, vi, afterEach } from "vitest";
import { track, getAttribution, stampSession, FIRST_LANDING_KEY, REFERRER_KEY } from "@/lib/track";

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubBrowser(opts: { pathname?: string; referrer?: string; store?: Map<string, string> }) {
  const store = opts.store ?? new Map<string, string>();
  vi.stubGlobal("location", { pathname: opts.pathname ?? "/", hostname: "adityadev.in" });
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

  it("track() routes through gtag('event', …) on the direct-GA4 path (red-team fix)", () => {
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
    expect(getAttribution()).toEqual({ source_page: "/", first_landing: "", referrer: "" });
  });
});
