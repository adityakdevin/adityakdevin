"use client";

import { useState } from "react";
import { profile } from "@/content/data/profile";
import { EMAIL_RE } from "@/lib/site";

type Status = "idle" | "submitting" | "success" | "error";

/**
 * Newsletter capture (design doc 20260717) - rendered on every post page and
 * on the /blog index. Same state pattern as ContactForm: inline validation,
 * submitting lock (blocks double-click double-subscribes), success panel,
 * error with direct-email fallback. Honeypot invisible to humans.
 */
export function NewsletterForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "submitting") return;
    const data = Object.fromEntries(new FormData(e.currentTarget).entries()) as Record<
      string,
      string
    >;

    const email = (data.email ?? "").trim();
    if (!EMAIL_RE.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError(null);
    setStatus("submitting");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, website: data.website ?? "" }),
      });
      setStatus(res.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div
        role="status"
        className="rounded border p-5"
        style={{ borderColor: "var(--accent)", background: "var(--surface)" }}
      >
        <p className="mono text-sm font-semibold" style={{ color: "var(--accent)" }}>
           Check your inbox to confirm - then new field notes land there.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-label="Newsletter signup"
      className="rounded border p-5"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <p className="mono text-sm font-semibold">
        <span style={{ color: "var(--accent)" }}>$</span> subscribe --notes
      </p>
      <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
        New build walkthroughs and Laravel + AI notes, straight to your inbox. No spam,
        unsubscribe anytime.
      </p>

      {/* Honeypot - invisible to humans, tempting to bots */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Company website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <label htmlFor="nf-email" className="sr-only">
          Email address
        </label>
        <input
          id="nf-email"
          name="email"
          type="email"
          required
          placeholder="you@company.com"
          aria-invalid={!!error}
          aria-describedby={error ? "nf-email-err" : undefined}
          className="min-h-11 min-w-0 flex-1 rounded border px-3 py-2"
          style={{ borderColor: error ? "var(--error)" : "var(--border)", color: "var(--text)" }}
        />
        <button
          type="submit"
          disabled={status === "submitting"}
          className="btn mono min-h-11 cursor-pointer rounded px-5 py-2 text-sm font-semibold disabled:cursor-wait disabled:opacity-70"
          style={{ background: "var(--accent)", color: "var(--on-accent)" }}
        >
          {status === "submitting" ? "Subscribing..." : "Subscribe"}
        </button>
      </div>

      {error ? (
        <p id="nf-email-err" className="mt-2 text-sm" style={{ color: "var(--error)" }}>
          {error}
        </p>
      ) : null}
      {status === "error" ? (
        <p role="alert" className="mt-2 text-sm" style={{ color: "var(--error)" }}>
          Couldn&apos;t sign you up right now - try again, or email{" "}
          <a href={`mailto:${profile.email}`}>{profile.email}</a>.
        </p>
      ) : null}
    </form>
  );
}
