import { describe, it, expect, vi, afterEach } from "vitest";
import { createRateLimiter } from "@/lib/ratelimit";

afterEach(() => {
  vi.useRealTimers();
});

describe("lib/ratelimit.ts", () => {
  it("allows up to the limit, blocks past it", () => {
    const limited = createRateLimiter(3, 60_000);
    expect(limited("ip-a")).toBe(false);
    expect(limited("ip-a")).toBe(false);
    expect(limited("ip-a")).toBe(false);
    expect(limited("ip-a")).toBe(true);
  });

  it("tracks keys independently", () => {
    const limited = createRateLimiter(1, 60_000);
    expect(limited("ip-a")).toBe(false);
    expect(limited("ip-a")).toBe(true);
    expect(limited("ip-b")).toBe(false);
  });

  it("resets after the window elapses", () => {
    vi.useFakeTimers();
    const limited = createRateLimiter(1, 60_000);
    expect(limited("ip-a")).toBe(false);
    expect(limited("ip-a")).toBe(true);
    vi.advanceTimersByTime(60_001);
    expect(limited("ip-a")).toBe(false);
  });

  it("prunes expired entries once the map grows large (D14 - no unbounded growth)", () => {
    vi.useFakeTimers();
    const limited = createRateLimiter(5, 60_000);
    // 5000 one-shot IPs fill the map to the prune threshold...
    for (let i = 0; i < 5000; i++) limited(`bot-${i}`);
    expect(limited.size()).toBe(5000);
    // ...their windows expire, and the next call sweeps them. Asserting on the
    // actual map size - an expired-in-place entry behaves identically at the
    // API, so only size proves the sweep is real (review finding: the previous
    // version of this test passed with prune() deleted).
    vi.advanceTimersByTime(60_001);
    limited("fresh-key");
    expect(limited.size()).toBe(1);
  });
});
