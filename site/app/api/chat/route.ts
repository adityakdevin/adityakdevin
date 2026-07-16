import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt } from "@/lib/prompt";
import { costUsd } from "@/lib/cost";

/**
 * /api/chat (SPEC §6) — Claude Haiku streaming behind the widget.
 * Ships dormant: without ANTHROPIC_API_KEY it answers 503 "unconfigured" and
 * the widget stays offline-commands-only. Guardrails are non-negotiable:
 * 300-char input cap, 500-token response cap, 10 msg/hr per IP, and a hard
 * monthly spend circuit breaker at $10 — an alarm alone is not enforcement.
 */

const MODEL = "claude-haiku-4-5";
const MAX_INPUT_CHARS = 300;
const MAX_OUTPUT_TOKENS = 500;

// ponytail: in-memory per-instance rate limit + spend counter — same tradeoff
// as /api/contact; swap both for Upstash when the account exists (TODOS/T3).
const hits = new Map<string, { count: number; reset: number }>();
const LIMIT = 10;
const WINDOW_MS = 60 * 60 * 1000;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now > entry.reset) {
    hits.set(ip, { count: 1, reset: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > LIMIT;
}

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

// Frozen at module load — byte-stable across requests so the prompt cache hits.
const SYSTEM_PROMPT = buildSystemPrompt();

export async function POST(req: NextRequest) {
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

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: "Rate limit: 10 questions per hour.", reason: "rate" },
      { status: 429 },
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
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

  const client = new Anthropic({ apiKey });
  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: MAX_OUTPUT_TOKENS,
    system: [
      { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
    ],
    messages: [{ role: "user", content: message }],
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        const final = await stream.finalMessage();
        recordSpend(costUsd(final.usage));
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
