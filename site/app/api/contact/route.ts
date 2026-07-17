import { NextRequest, NextResponse } from "next/server";
import { profile } from "@/content/data/profile";
import { createRateLimiter, clientIp } from "@/lib/ratelimit";
import { EMAIL_RE, EMAIL_MAX } from "@/lib/site";

/**
 * Contact handler (SPEC §10): validation + honeypot + rate limit + error contract.
 * Sends via Mailtrap's transactional API (plain POST — no SDK needed).
 * Errors are logged server-side only — the client never sees vendor details.
 */

const rateLimited = createRateLimiter(5, 60 * 60 * 1000);

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** Terminal-card notification email — inline styles only (Gmail-safe), dark in every client. */
function emailHtml(
  name: string,
  email: string,
  message: string,
  attr: ReadonlyArray<readonly [string, string]> = [],
) {
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
        ${attr.map(([k, v]) => row(k, escapeHtml(v))).join("")}
      </table>
      <div style="background:#161b22;border:1px solid #30363d;border-radius:6px;padding:16px;color:#e6edf3;font-family:${mono};font-size:14px;line-height:1.6;white-space:pre-wrap;word-break:break-word">${escapeHtml(message)}</div>
      <p style="margin:20px 0 0;font-family:${mono};font-size:12px;color:#8b949e">reply to this email to answer ${escapeHtml(name)} directly &#8594;</p>
    </div>
  </div>
  <p style="max-width:560px;margin:12px auto 0;font-family:${mono};font-size:11px;color:#8b949e;text-align:center">sent by the contact form on adityadev.in</p>
</div>`;
}

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

  // Honeypot: bots fill the hidden field — pretend success, send nothing.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  // D15 attribution — optional, never validated hard (old clients and
  // privacy-mode browsers send nothing). Shape-checked because these render
  // in the owner email styled like SYSTEM rows (red-team): paths must look
  // like site paths, referrer must be an http(s) URL, no CR/LF smuggling.
  const attrValue = (k: string): string => {
    const raw = typeof body[k] === "string" ? (body[k] as string).replace(/[\r\n]/g, " ").slice(0, 300) : "";
    if (raw === "") return "";
    if (k === "referrer") {
      try {
        return /^https?:$/.test(new URL(raw).protocol) ? raw : "";
      } catch {
        return "";
      }
    }
    return /^\/[\w\-/.%#?=&]*$/.test(raw) ? raw : "";
  };
  const attr = (["source_page", "first_landing", "referrer"] as const)
    .map((k) => [k, attrValue(k)] as const)
    .filter(([, v]) => v !== "");

  if (
    name.length < 2 ||
    name.length > 200 ||
    !EMAIL_RE.test(email) ||
    email.length > EMAIL_MAX ||
    message.length < 10 ||
    message.length > 5000
  ) {
    return NextResponse.json({ error: "Please check the form fields." }, { status: 422 });
  }

  const ip = clientIp(req);
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
      signal: AbortSignal.timeout(10_000), // hung vendor → catch → 502 + retry message
      headers: { "Api-Token": apiToken, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: { email: "contact@adityadev.in", name: "Portfolio" },
        to: [{ email: profile.email }],
        reply_to: { email },
        subject: `Portfolio contact from ${name}`,
        text:
          `From: ${name} <${email}>\n\n${message}` +
          (attr.length ? `\n\n--\n${attr.map(([k, v]) => `${k}: ${v}`).join("\n")}` : ""),
        html: emailHtml(name, email, message, attr),
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
