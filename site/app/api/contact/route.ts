import { NextRequest, NextResponse } from "next/server";
import { profile } from "@/content/data/profile";

/**
 * Contact handler (SPEC §10): validation + honeypot + rate limit + error contract.
 * Sends via Mailtrap's transactional API (plain POST — no SDK needed).
 * Errors are logged server-side only — the client never sees vendor details.
 */

// ponytail: in-memory per-instance rate limit — Upstash lands with /api/chat's
// counters when the account exists; a single Vercel instance covers P1a traffic.
const hits = new Map<string, { count: number; reset: number }>();
const LIMIT = 5;
const WINDOW_MS = 60 * 60 * 1000;

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** Terminal-card notification email — inline styles only (Gmail-safe), dark in every client. */
function emailHtml(name: string, email: string, message: string) {
  const mono = "ui-monospace,'SF Mono',Menlo,Consolas,monospace";
  const row = (k: string, v: string) =>
    `<tr><td style="padding:4px 16px 4px 0;color:#8b949e;font-family:${mono};font-size:13px;vertical-align:top;white-space:nowrap">${k}</td>` +
    `<td style="padding:4px 0;color:#e6edf3;font-family:${mono};font-size:13px;word-break:break-word">${v}</td></tr>`;
  return `<div style="background:#f2f4f7;padding:32px 16px">
  <div style="max-width:560px;margin:0 auto;background:#0d1117;border:1px solid #30363d;border-radius:8px;overflow:hidden">
    <div style="padding:10px 16px;border-bottom:1px solid #30363d;font-family:${mono};font-size:12px;color:#8b949e">
      <span style="color:#22b8d4">&#9679;</span>&nbsp;<span style="color:#30363d">&#9679;&nbsp;&#9679;</span>
      &nbsp;&nbsp;contact@adityadev.in
    </div>
    <div style="padding:24px">
      <p style="margin:0 0 16px;font-family:${mono};font-size:14px;color:#22b8d4">$ new message --from portfolio</p>
      <table cellpadding="0" cellspacing="0" style="margin:0 0 20px">
        ${row("name", escapeHtml(name))}
        ${row("email", `<a href="mailto:${escapeHtml(email)}" style="color:#22b8d4">${escapeHtml(email)}</a>`)}
      </table>
      <div style="background:#161b22;border:1px solid #30363d;border-radius:6px;padding:16px;color:#e6edf3;font-family:${mono};font-size:14px;line-height:1.6;white-space:pre-wrap;word-break:break-word">${escapeHtml(message)}</div>
      <p style="margin:20px 0 0;font-family:${mono};font-size:12px;color:#8b949e">reply to this email to answer ${escapeHtml(name)} directly &#8594;</p>
    </div>
  </div>
  <p style="max-width:560px;margin:12px auto 0;font-family:${mono};font-size:11px;color:#8b949e;text-align:center">sent by the contact form on adityadev.in</p>
</div>`;
}

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

  const apiToken = process.env.MAILTRAP_API_TOKEN;
  if (!apiToken) {
    console.error("contact: MAILTRAP_API_TOKEN not configured");
    return NextResponse.json({ error: "Sending is temporarily unavailable." }, { status: 503 });
  }

  try {
    const res = await fetch("https://send.api.mailtrap.io/api/send", {
      method: "POST",
      headers: { "Api-Token": apiToken, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: { email: "contact@adityadev.in", name: "Portfolio" },
        to: [{ email: profile.email }],
        reply_to: { email },
        subject: `Portfolio contact from ${name}`,
        text: `From: ${name} <${email}>\n\n${message}`,
        html: emailHtml(name, email, message),
        category: "contact-form",
      }),
    });
    if (!res.ok) throw new Error(`mailtrap ${res.status}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    // Log without message bodies (SPEC §10: 30-day retention is Vercel's log default)
    console.error("contact: send failed", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "Couldn't send right now." }, { status: 502 });
  }
}
