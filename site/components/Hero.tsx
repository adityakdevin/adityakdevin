import { profile } from "@/content/data/profile";
import { TypingCaption } from "@/components/TypingCaption";

/**
 * Hero (SPEC §5.1) — brand-first, full-bleed, ONE composition, dark in BOTH themes.
 * Prompt is an eyebrow device; the NAME is the output and the page's largest text.
 * Full text is server-rendered — the type-reveal animation is a pure CSS enhancement (§5A).
 */
export function Hero() {
  return (
    <section
      className="relative flex min-h-[min(84svh,760px)] flex-col justify-center overflow-hidden"
      style={{ background: "var(--hero-bg)", color: "var(--hero-text)" }}
    >
      {/* "Professionally lit": one soft cyan key light behind the composition */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 68% 40%, rgba(34,184,212,0.09), transparent 70%)",
        }}
      />
      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-10 px-6 py-16 md:grid-cols-[1fr_680px] md:gap-16">
        <div>
          <p className="mono mb-6 text-sm whitespace-nowrap" style={{ color: "var(--dark-muted)" }}>
            <span style={{ color: "var(--dark-accent)" }}>aditya@dev</span>:~$&nbsp;
            <span className="type-reveal">whoami</span>
            <span className="cursor" aria-hidden />
          </p>

          <h1 className="mono text-5xl font-semibold leading-[1.05] tracking-tight md:text-[64px]">
            {profile.name}
          </h1>

          <p className="mt-5 max-w-xl text-lg md:text-2xl" style={{ color: "var(--dark-text)" }}>
            {profile.valueLine}
          </p>

          <p className="mono mt-4 text-sm md:text-base" style={{ color: "var(--dark-muted)" }}>
            {profile.headline} — {profile.role} @ {profile.company} · {profile.yearsExperience} yrs
            · Lucknow, India
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a
              href={profile.bookingUrl}
              className="btn mono min-h-11 rounded px-6 py-3 text-center text-base font-semibold no-underline"
              // theme-locked dark hero: literal pair, NOT tokens (light-theme --on-accent is white)
              style={{ background: "var(--dark-accent)", color: "var(--dark-on-accent)" }}
            >
              Book a call →
            </a>
            <a
              href="#work"
              className="btn mono min-h-11 rounded border px-6 py-3 text-center text-base no-underline"
              style={{ borderColor: "var(--dark-border)", color: "var(--dark-text)" }}
            >
              See the work ↓
            </a>
          </div>
        </div>

        {/* Anchor: gh-ascii GitHub card in a terminal window — same artwork as the profile README */}
        <div className="relative mx-auto w-full max-w-lg md:max-w-none">
          <div
            className="overflow-hidden rounded-lg border shadow-2xl"
            style={{ borderColor: "var(--dark-border)", background: "var(--dark-surface)", boxShadow: "0 24px 64px rgba(0,0,0,0.5), 0 0 48px rgba(34,184,212,0.08)" }}
          >
            <div
              className="mono flex items-center gap-1.5 border-b px-3 py-2 text-xs"
              style={{ borderColor: "var(--dark-border)", color: "var(--dark-muted)" }}
            >
              <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--dark-border)" }} />
              <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--dark-border)" }} />
              <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--dark-accent)" }} />
              <span className="ml-2">adityakdevin@github</span>
            </div>
            {/* ASCII portrait (cropped from the README card) + stats as real, legible HTML text.
                Mobile: stacked (portrait on top, full-width stats) so key/value rows never wrap. */}
            <div className="flex flex-col items-stretch sm:flex-row">
              {/* eslint-disable-next-line @next/next/no-img-element -- static SVG asset, no optimization needed */}
              <img
                src="/ascii-portrait.svg"
                alt="ASCII-art portrait of adityakdevin"
                className="h-48 w-full object-contain pt-4 sm:h-auto sm:w-[44%] sm:object-left sm:pt-0"
              />
              {/* ponytail: stats snapshot, refresh when the README card regenerates */}
              <div className="mono flex-1 self-center px-5 py-5 text-[14px] leading-relaxed sm:pl-2 sm:pr-5">
                <p className="mb-2 font-semibold" style={{ color: "var(--dark-accent)" }}>
                  — {profile.handle}@github
                </p>
                {(
                  [
                    ["uptime", "9+ years on GitHub"],
                    ["location", "Lucknow, India"],
                    ["languages", "PHP · JS · Python"],
                  ] as const
                ).map(([k, v]) => (
                  <p key={k} className="flex items-baseline gap-2">
                    <span style={{ color: "var(--dark-muted)" }}>{k}</span>
                    <span
                      aria-hidden
                      className="flex-1 border-b border-dotted"
                      style={{ borderColor: "var(--dark-border)" }}
                    />
                    <span style={{ color: "var(--dark-text)" }}>{v}</span>
                  </p>
                ))}
                <p className="mb-2 mt-4 font-semibold" style={{ color: "var(--dark-accent)" }}>
                  — stats
                </p>
                {(
                  [
                    ["repos", "64"],
                    ["commits", "8.3k+"],
                    ["series", "Laravel + AI on dev.to"],
                  ] as const
                ).map(([k, v]) => (
                  <p key={k} className="flex items-baseline gap-2">
                    <span style={{ color: "var(--dark-muted)" }}>{k}</span>
                    <span
                      aria-hidden
                      className="flex-1 border-b border-dotted"
                      style={{ borderColor: "var(--dark-border)" }}
                    />
                    <span style={{ color: "var(--dark-text)" }}>{v}</span>
                  </p>
                ))}
                <p className="mt-4">
                  <span style={{ color: "var(--dark-accent)" }}>$</span>{" "}
                  <span style={{ color: "var(--dark-text)" }}>open github/adityakdevin</span>
                  <span className="cursor" />
                </p>
              </div>
            </div>
            <a
              href={profile.github}
              className="mono block whitespace-nowrap border-t px-3 py-2.5 text-center text-sm font-medium no-underline transition-colors hover:underline"
              style={{ borderColor: "var(--dark-border)", color: "var(--dark-accent)" }}
            >
              <TypingCaption
                phrases={[
                  "Full Stack Developer + AI Engineer",
                  `Tech Lead @ ${profile.company}`,
                  "Laravel · Vue · React · LLM apps",
                  "github.com/adityakdevin →",
                ]}
              />
            </a>
          </div>
        </div>
      </div>

      {/* Fold hint: seam into the light/next content */}
      <div className="mx-auto w-full max-w-5xl px-6 pb-5">
        <p className="mono text-xs" style={{ color: "var(--dark-muted)" }}>
          <span style={{ color: "var(--dark-accent)" }}>$</span> scroll --to proof ↓
        </p>
      </div>
      <div aria-hidden className="h-1 w-full" style={{ background: "linear-gradient(90deg, #22b8d4, transparent)" }} />
    </section>
  );
}
