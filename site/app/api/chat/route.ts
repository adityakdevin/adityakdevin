import { NextRequest, NextResponse } from "next/server";
import { streamText } from "ai";
import { buildSystemPrompt } from "@/lib/prompt";
import { costUsd } from "@/lib/cost";
import { createRateLimiter, clientIp } from "@/lib/ratelimit";

/**
 * /api/chat (SPEC §6) — Claude Haiku streaming via Vercel AI Gateway.
 * Auth is ambient: VERCEL_OIDC_TOKEN on Vercel deployments (auto-injected),
 * AI_GATEWAY_API_KEY elsewhere. Without either it answers 503 "unconfigured"
 * and the widget stays offline-commands-only. Guardrails are non-negotiable:
 * 300-char input cap, 500-token response cap, 10 msg/hr per IP, and a hard
 * monthly spend circuit breaker at $10 — an alarm alone is not enforcement.
 */

const MODEL = "anthropic/claude-haiku-4.5"; // gateway slug — dots, not hyphens
const MAX_INPUT_CHARS = 300;
const MAX_OUTPUT_TOKENS = 500;

// ponytail: in-memory per-instance rate limit + spend counter — swap for the
// gateway's per-user limits + Upstash once traffic justifies it (TODOS/T3).
// Limiter shared with contact/subscribe (lib/ratelimit.ts) — Upstash swap is one file.
const rateLimited = createRateLimiter(10, 60 * 60 * 1000);

const SPEND_CAP_USD = 10;
const spend = { month: "", usd: 0 };

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7); // spend:YYYY-MM
}

function overSpendCap(): boolean {
  return spend.month === currentMonth() && spend.usd >= SPEND_CAP_USD;
}

function recordSpend(usd: number) {
  const month = currentMonth();
  if (spend.month !== month) {
    spend.month = month;
    spend.usd = 0;
  }
  spend.usd += usd;
}

// Frozen at module load — byte-stable across requests so provider caching can engage.
const SYSTEM_PROMPT = buildSystemPrompt();

export async function POST(req: NextRequest) {
  // Body-size gate BEFORE parsing (adversarial finding) — input cap is 300
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
      { error: `Questions must be 1–${MAX_INPUT_CHARS} characters.` },
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

  if (overSpendCap()) {
    return NextResponse.json(
      { error: "AI is resting (monthly budget cap).", reason: "budget" },
      { status: 503 },
    );
  }

  const result = streamText({
    model: MODEL,
    system: SYSTEM_PROMPT,
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
        recordSpend(
          costUsd({
            input_tokens: usage.inputTokens ?? 0,
            output_tokens: usage.outputTokens ?? 0,
          }),
        );
      } catch (err) {
        // Mid-stream failure → friendly line, never a frozen cursor (§6).
        console.error("chat: stream failed", err instanceof Error ? err.message : "unknown");
        controller.enqueue(
          encoder.encode("\n[connection hiccup — that's all I got. Ask again, or try 'help'.]"),
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
