import Image from "next/image";
import { profile } from "@/content/data/profile";

/**
 * Hero (SPEC §5.1) — brand-first, full-bleed, ONE composition, dark in BOTH themes.
 * Prompt is an eyebrow device; the NAME is the output and the page's largest text.
 * Full text is server-rendered — the type-reveal animation is a pure CSS enhancement (§5A).
 */
export function Hero() {
  return (
    <section
      className="relative flex min-h-[min(92svh,860px)] flex-col justify-center overflow-hidden"
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
      <div className="relative mx-auto grid w-full max-w-5xl items-center gap-10 px-6 py-16 md:grid-cols-[1fr_360px] md:gap-16">
        <div>
          {/* Mobile anchor (§5B / FINDING-003): compact photo above the name — desktop uses the side panel */}
          <div className="mb-6 md:hidden">
            <Image
              src="/aditya.jpg"
              alt={`${profile.name} — ${profile.headline}`}
              width={96}
              height={96}
              priority
              className="h-24 w-24 rounded-lg border object-cover object-top"
              style={{
                borderColor: "#30363d",
                filter: "grayscale(0.85) contrast(1.05) brightness(0.95)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.4), 0 0 24px rgba(34,184,212,0.1)",
              }}
            />
          </div>
          <p className="mono mb-6 text-sm whitespace-nowrap" style={{ color: "#8b949e" }}>
            <span style={{ color: "#22b8d4" }}>aditya@dev</span>:~$&nbsp;
            <span className="type-reveal cursor">whoami</span>
          </p>

          <h1 className="mono text-5xl font-semibold leading-[1.05] tracking-tight md:text-[72px]">
            {profile.name}
          </h1>

          <p className="mt-5 max-w-xl text-lg md:text-2xl" style={{ color: "#e6edf3" }}>
            {profile.valueLine}
          </p>

          <p className="mono mt-4 text-sm md:text-base" style={{ color: "#8b949e" }}>
            {profile.headline} — {profile.role} @ {profile.company} · {profile.yearsExperience} yrs
            · Lucknow, India
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a
              href={profile.bookingUrl}
              className="btn mono min-h-11 rounded px-6 py-3 text-center text-base font-semibold no-underline"
              // theme-locked dark hero: literal pair, NOT tokens (light-theme --on-accent is white)
              style={{ background: "#22b8d4", color: "#06222a" }}
            >
              Book a call →
            </a>
            <a
              href="#work"
              className="btn mono min-h-11 rounded border px-6 py-3 text-center text-base no-underline"
              style={{ borderColor: "#30363d", color: "#e6edf3" }}
            >
              See the work ↓
            </a>
          </div>
        </div>

        {/* Anchor: real photo, duotone/cyan treatment so it belongs to the terminal world */}
        <div className="relative mx-auto hidden w-full max-w-sm md:block">
          <div
            className="overflow-hidden rounded-lg border shadow-2xl"
            style={{ borderColor: "#30363d", background: "#161b22", boxShadow: "0 24px 64px rgba(0,0,0,0.5), 0 0 48px rgba(34,184,212,0.08)" }}
          >
            <div
              className="mono flex items-center gap-1.5 border-b px-3 py-2 text-xs"
              style={{ borderColor: "#30363d", color: "#8b949e" }}
            >
              <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: "#30363d" }} />
              <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: "#30363d" }} />
              <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: "#22b8d4" }} />
              <span className="ml-2">aditya.jpg</span>
            </div>
            <Image
              src="/aditya.jpg"
              alt={`${profile.name} — ${profile.headline}`}
              width={320}
              height={380}
              priority
              className="h-auto w-full object-cover"
              style={{ filter: "grayscale(0.85) contrast(1.05) brightness(0.95)" }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2"
              style={{ background: "linear-gradient(transparent, rgba(34,184,212,0.14))" }}
            />
          </div>
        </div>
      </div>

      {/* Fold hint: seam into the light/next content */}
      <div className="mx-auto w-full max-w-5xl px-6 pb-5">
        <p className="mono text-xs" style={{ color: "#8b949e" }}>
          <span style={{ color: "#22b8d4" }}>$</span> scroll --to proof ↓
        </p>
      </div>
      <div aria-hidden className="h-1 w-full" style={{ background: "linear-gradient(90deg, #22b8d4, transparent)" }} />
    </section>
  );
}
