"use client";

import { useState } from "react";
import { profile } from "@/content/data/profile";

type Status = "idle" | "submitting" | "success" | "error";

/**
 * Contact form — full visual state coverage per SPEC §5A:
 * inline validation on blur, submitting lock, success panel, error with direct-email fallback.
 * Labels always visible (never placeholder-as-label). Honeypot field invisible to humans.
 */
export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validateField(name: string, value: string): string | null {
    if (name === "name" && value.trim().length < 2) return "Please enter your name.";
    if (name === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
      return "Please enter a valid email address.";
    if (name === "message" && value.trim().length < 10)
      return "Tell me a little more — at least a sentence.";
    return null;
  }

  function onBlur(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    const err = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: err ?? "" }));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;

    const nextErrors: Record<string, string> = {};
    for (const field of ["name", "email", "message"]) {
      const err = validateField(field, data[field] ?? "");
      if (err) nextErrors[field] = err;
    }
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setStatus("submitting");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
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
        className="rounded border p-6"
        style={{ borderColor: "var(--accent)", background: "var(--surface)" }}
      >
        <p className="mono font-semibold" style={{ color: "var(--accent)" }}>
          ✓ Got it — I reply within 24 hours.
        </p>
        <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
          Prefer faster? <a href={profile.bookingUrl}>Book a call directly</a>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {/* Honeypot — invisible to humans, tempting to bots */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Company website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="cf-name" className="mono mb-1 block text-sm" style={{ color: "var(--muted)" }}>
            name *
          </label>
          <input
            id="cf-name"
            name="name"
            type="text"
            required
            onBlur={onBlur}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "cf-name-err" : undefined}
            className="min-h-11 w-full rounded border px-3 py-2"
            style={{ background: "var(--surface)", borderColor: errors.name ? "#d1242f" : "var(--border)", color: "var(--text)" }}
          />
          {errors.name ? (
            <p id="cf-name-err" className="mt-1 text-sm" style={{ color: "#d1242f" }}>
              {errors.name}
            </p>
          ) : null}
        </div>
        <div>
          <label htmlFor="cf-email" className="mono mb-1 block text-sm" style={{ color: "var(--muted)" }}>
            email *
          </label>
          <input
            id="cf-email"
            name="email"
            type="email"
            required
            onBlur={onBlur}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "cf-email-err" : undefined}
            className="min-h-11 w-full rounded border px-3 py-2"
            style={{ background: "var(--surface)", borderColor: errors.email ? "#d1242f" : "var(--border)", color: "var(--text)" }}
          />
          {errors.email ? (
            <p id="cf-email-err" className="mt-1 text-sm" style={{ color: "#d1242f" }}>
              {errors.email}
            </p>
          ) : null}
        </div>
      </div>

      <div>
        <label htmlFor="cf-message" className="mono mb-1 block text-sm" style={{ color: "var(--muted)" }}>
          what are you building? *
        </label>
        <textarea
          id="cf-message"
          name="message"
          rows={5}
          required
          onBlur={onBlur}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "cf-message-err" : undefined}
          className="w-full rounded border px-3 py-2"
          style={{ background: "var(--surface)", borderColor: errors.message ? "#d1242f" : "var(--border)", color: "var(--text)" }}
        />
        {errors.message ? (
          <p id="cf-message-err" className="mt-1 text-sm" style={{ color: "#d1242f" }}>
            {errors.message}
          </p>
        ) : null}
      </div>

      {status === "error" ? (
        <p role="alert" className="rounded border p-3 text-sm" style={{ borderColor: "#d1242f", color: "var(--text)" }}>
          Couldn&apos;t send — try again, or email me directly at{" "}
          <a href={`mailto:${profile.email}`}>{profile.email}</a>.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="btn mono min-h-11 cursor-pointer rounded px-6 py-3 font-semibold disabled:cursor-wait disabled:opacity-70"
        style={{ background: "var(--accent)", color: "#06222a" }}
      >
        {status === "submitting" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
