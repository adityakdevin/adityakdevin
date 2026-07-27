import { describe, it, expect, beforeEach } from "vitest";
import { recordSpend, overSpendCap, spentUsd, resetSpend } from "@/lib/spend";

describe("lib/spend monthly ledger", () => {
  beforeEach(() => resetSpend());

  it("accumulates and trips the cap at the threshold, not past it", () => {
    expect(overSpendCap(10)).toBe(false);
    recordSpend(9.99);
    expect(overSpendCap(10)).toBe(false);
    recordSpend(0.01);
    expect(overSpendCap(10)).toBe(true); // >= is the gate, not >
  });

  it("refunds a reservation when given a negative delta", () => {
    recordSpend(0.05); // reserve worst case
    recordSpend(0.01 - 0.05); // reconcile to the $0.01 actually billed
    expect(spentUsd()).toBeCloseTo(0.01, 10);
  });

  it("never goes negative, so an over-refund can't gift budget", () => {
    recordSpend(0.01);
    recordSpend(-5); // refund larger than the ledger (month rollover mid-flight)
    expect(spentUsd()).toBe(0);
    recordSpend(10);
    expect(overSpendCap(10)).toBe(true); // the cap still bites afterwards
  });

  it("a burst of reservations trips the cap without any stream completing", () => {
    // The whole point of reserve-before-stream: 200 in-flight requests that
    // have not yet reported usage still add up to a closed gate.
    for (let i = 0; i < 200; i++) recordSpend(0.05);
    expect(overSpendCap(10)).toBe(true);
  });
});
