/**
 * Monthly spend ledger for /api/chat (SPEC S6).
 *
 * Extracted from api/chat/route.ts for the same reason lib/ratelimit.ts was
 * extracted from api/contact: a guardrail you cannot observe is a guardrail you
 * cannot prove. The reserve/reconcile ordering below is the whole point of this
 * module, and it needs to be testable without booting a route.
 *
 * ponytail: per-instance counter, NOT a global ledger. Parallel Vercel instances
 * and cold starts each get a fresh cap - the hard cross-instance limit is the AI
 * Gateway spend limit on the Vercel project. What this DOES buy is that a burst
 * of concurrent requests can't all read $0 and slip past together. Swap for
 * Upstash alongside the ratelimit swap when traffic justifies one.
 */

const ledger = { month: "", usd: 0 };

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7); // YYYY-MM
}

/**
 * Accepts a negative delta (reservation refund). Clamped at zero so a refund
 * that straddles a month rollover can't push the ledger negative and gift budget.
 */
export function recordSpend(usd: number) {
  const month = currentMonth();
  if (ledger.month !== month) {
    ledger.month = month;
    ledger.usd = 0;
  }
  ledger.usd = Math.max(0, ledger.usd + usd);
}

export function overSpendCap(capUsd: number): boolean {
  return ledger.month === currentMonth() && ledger.usd >= capUsd;
}

/** Observable for tests - reserve-before-stream must be provably real, not vacuous. */
export function spentUsd(): number {
  return ledger.month === currentMonth() ? ledger.usd : 0;
}

/** Test-only reset; production never needs it (month rollover handles itself). */
export function resetSpend() {
  ledger.month = "";
  ledger.usd = 0;
}
