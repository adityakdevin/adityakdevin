import { NextRequest, NextResponse } from "next/server";
import { streamText } from "ai";
import { buildSystemPrompt } from "@/lib/prompt";
import { costUsd } from "@/lib/cost";
import { createRateLimiter, clientIp } from "@/lib/ratelimit";
import { recordSpend, overSpendCap } from "@/lib/spend";

/**
 * /api/chat (SPEC S6) - Claude Haiku streaming via Vercel AI Gateway.
 * Auth is ambient: VERCEL_OIDC_TOKEN on Vercel deployments (auto-injected),
 * AI_GATEWAY_API_KEY elsewhere. Without either it answers 503 "unconfigured"
 * and the widget stays offline-commands-only. Guardrails are non-negotiable:
 * 300-char input cap, 500-token response cap, 10 msg/hr per IP, and a monthly
 * spend circuit breaker at $10 - an alarm alone is not enforcement.
 *
 * SCOPE OF THE SPEND CAP - read before trusting it. The ledger (lib/spend.ts)
 * lives in one server process. It is a per-instance brake, NOT a global one:
 * parallel Vercel instances and cold starts each get a fresh $10. The hard,
 * cross-instance cap is the AI Gateway spend limit configured on the Vercel
 * project - this file cannot enforce that and does not claim to. What it DOES
 * guarantee is that a burst of concurrent requests can't all read $0 and slip
 * past together: cost is reserved before the stream opens and reconciled after,
 * which is the failure the old record-after-streaming order allowed.
 */

const MODEL = "anthropic/claude-haiku-4.5"; // gateway slug - dots, not hyphens
const MAX_INPUT_CHARS = 300;
const MAX_OUTPUT_TOKENS = 500;

// ponytail: in-memory per-instance rate limit - swap for the gateway's per-user
// limits + Upstash once traffic justifies it (TODOS/T3).
// Limiter shared with contact/subscribe (lib/ratelimit.ts) - Upstash swap is one file.
const rateLimited = createRateLimiter(10, 60 * 60 * 1000);

const SPEND_CAP_USD = 10;

// Frozen at module load - byte-stable across requests so provider caching can engage.
const SYSTEM_PROMPT = buildSystemPrompt();

/**
 * Worst-case bill for one call: the whole system prompt billed uncached (cache
 * miss / first request of a TTL window) plus a maxed-out response. ~4 chars per
 * token is the standard rough ratio; it only has to be an over-estimate, since
 * every request reconciles down to actual usage the moment the stream ends.
 */
const MAX_COST_USD = costUsd({
  input_tokens: Math.ceil(SYSTEM_PROMPT.length / 4) + MAX_INPUT_CHARS,
  output_tokens: MAX_OUTPUT_TOKENS,
});

export async function POST(req: NextRequest) {
  // Body-size gate BEFORE parsing (adversarial finding) - input cap is 300
  // chars; anything past 32KB is abuse, reject before burning parse CPU.
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > 32_768) {
    return NextResponse.json({ error: "Request too large." }, { status: 413 });
  }
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (message.length === 0 || message.length > MAX_INPUT_CHARS) {
    return NextResponse.json(
      { error: `Questions must be 1-${MAX_INPUT_CHARS} characters.` },
      { status: 422 },
    );
  }

  const ip = clientIp(req);
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: "Rate limit: 10 questions per hour.", reason: "rate" },
      { status: 429 },
    );
  }

  if (!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL_OIDC_TOKEN) {
    return NextResponse.json(
      { error: "AI mode is not configured yet.", reason: "unconfigured" },
      { status: 503 },
    );
  }

  if (overSpendCap(SPEND_CAP_USD)) {
    return NextResponse.json(
      { error: "AI is resting (monthly budget cap).", reason: "budget" },
      { status: 503 },
    );
  }

  // Reserve the worst case BEFORE opening the stream. Recording after the
  // stream (the old order) let N concurrent requests all read spend=$0, pass
  // the gate together, and blow through the cap N-calls deep. Reserving first
  // means the Nth caller sees the first N-1 reservations already on the books.
  recordSpend(MAX_COST_USD);

  const result = streamText({
    model: MODEL,
    // Object form, not a bare string: the cache breakpoint has to sit ON the
    // system message. The whole corpus rides here, so every request after the
    // first in a TTL window reads it from cache instead of re-billing it.
    system: {
      role: "system",
      content: SYSTEM_PROMPT,
      providerOptions: { anthropic: { cacheControl: { type: "ephemeral" } } },
    },
    prompt: message,
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    providerOptions: { gateway: { tags: ["feature:askaditya"], user: ip } },
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of result.textStream) {
          controller.enqueue(encoder.encode(chunk));
        }
        const usage = await result.usage;
        // Reconcile the reservation down to what was actually billed. Negative
        // delta = refund; the reservation is deliberately generous, so this
        // almost always gives money back.
        recordSpend(
          costUsd({
            input_tokens: usage.inputTokens ?? 0,
            output_tokens: usage.outputTokens ?? 0,
          }) - MAX_COST_USD,
        );
      } catch (err) {
        // ponytail: no refund on a failed stream - we don't know what the
        // provider billed for partial output, so the reservation stands. Errs
        // toward tripping the cap early, which is the right way for a spend
        // breaker to be wrong. Revisit if flaky streams start eating budget.
        // Mid-stream failure → friendly line, never a frozen cursor (S6).
        console.error("chat: stream failed", err instanceof Error ? err.message : "unknown");
        controller.enqueue(
          encoder.encode("\n[connection hiccup - that's all I got. Ask again, or try 'help'.]"),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
