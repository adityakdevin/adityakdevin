import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { profile } from "@/content/data/profile";

/**
 * Contact handler (SPEC §10): validation + honeypot + rate limit + error contract.
 * Errors are logged server-side only — the client never sees vendor details.
 */

// ponytail: in-memory per-instance rate limit — Upstash lands with /api/chat in P3,
// which is when a shared store exists anyway; a single Vercel instance covers P1a traffic.
const hits = new Map<string, { count: number; reset: number }>();
const LIMIT = 5;
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

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Honeypot: bots fill the hidden field — pretend success, send nothing.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (
    name.length < 2 ||
    name.length > 200 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    email.length > 320 ||
    message.length < 10 ||
    message.length > 5000
  ) {
    return NextResponse.json({ error: "Please check the form fields." }, { status: 422 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "Too many messages — try again later." }, { status: 429 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("contact: RESEND_API_KEY not configured");
    return NextResponse.json({ error: "Sending is temporarily unavailable." }, { status: 503 });
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: "Portfolio <contact@adityadev.in>",
      to: [profile.email],
      replyTo: email,
      subject: `Portfolio contact from ${name}`,
      text: `From: ${name} <${email}>\n\n${message}`,
    });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    // Log without message bodies (SPEC §10: 30-day retention is Vercel's log default)
    console.error("contact: send failed", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "Couldn't send right now." }, { status: 502 });
  }
}
