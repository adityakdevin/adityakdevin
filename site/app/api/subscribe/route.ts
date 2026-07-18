import { NextRequest, NextResponse } from "next/server";
import { createRateLimiter, clientIp } from "@/lib/ratelimit";
import { EMAIL_RE, EMAIL_MAX } from "@/lib/site";

/**
 * Newsletter signup (design doc 20260717, eng review D11/D12): same S10
 * hardening as the contact form - honeypot, rate limit, server-side
 * validation, vendor errors logged but NEVER leaked to the client.
 * Proxies to Buttondown so the API key stays server-side; Buttondown owns
 * double-opt-in, unsubscribe, and archives.
 */

const rateLimited = createRateLimiter(5, 60 * 60 * 1000);

export async function POST(req: NextRequest) {
  // Body-size gate BEFORE parsing (adversarial finding): don't burn CPU/memory
  // on oversized JSON that the limiter never sees. 32KB >> any legal payload.
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

  // Honeypot: bots fill the hidden field - pretend success, send nothing.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!EMAIL_RE.test(email) || email.length > EMAIL_MAX) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 422 });
  }

  const ip = clientIp(req);
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "Too many attempts - try again later." }, { status: 429 });
  }

  const apiKey = process.env.BUTTONDOWN_API_KEY;
  if (!apiKey) {
    console.error("subscribe: BUTTONDOWN_API_KEY not configured");
    return NextResponse.json({ error: "Signup is temporarily unavailable." }, { status: 503 });
  }

  try {
    const res = await fetch("https://api.buttondown.com/v1/subscribers", {
      method: "POST",
      headers: { Authorization: `Token ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email_address: email }),
      // A hung vendor connection must not pin the function or the user's
      // "Subscribing..." state - AbortError falls into the catch → 502 + retry.
      signal: AbortSignal.timeout(10_000),
    });

    if (res.status === 201) return NextResponse.json({ ok: true });

    // Already subscribed → idempotent success: re-submitting is not an error.
    // Prefer Buttondown's stable error code; fall back to wording only if the
    // body isn't the expected JSON shape.
    if (res.status === 400) {
      const detail = await res.text();
      let code = "";
      try {
        code = String(JSON.parse(detail)?.code ?? "");
      } catch {
        // non-JSON body - wording fallback below
      }
      if (code === "email_already_exists" || (!code && /already|exists|subscribed/i.test(detail))) {
        return NextResponse.json({ ok: true });
      }
    }
    throw new Error(`buttondown ${res.status}`);
  } catch (err) {
    // Log without email addresses (SPEC S10: no bodies in logs, 30-day retention).
    console.error("subscribe: signup failed", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "Couldn't sign you up right now." }, { status: 502 });
  }
}
