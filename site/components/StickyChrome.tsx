"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { profile } from "@/content/data/profile";
import { ThemeToggle } from "@/components/ThemeToggle";

/**
 * Global chrome (SPEC §5, design review 3A + FINDING-001):
 * - Home: header appears after scrolling past the hero (the hero IS the identity).
 * - Every other page: header visible immediately — trunk test requires site ID + nav on landing.
 * - Mobile: sticky bottom "Book a call →" bar instead.
 */
export function StickyChrome() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const visible = isHome ? scrolled : true;

  useEffect(() => {
    if (!isHome) return;
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  return (
    <div data-no-print>
      {/* Desktop sticky header */}
      <header
        className={`fixed inset-x-0 top-0 z-40 hidden border-b transition-transform duration-200 md:block ${
          visible ? "translate-y-0" : "-translate-y-full"
        }`}
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        aria-hidden={!visible}
      >
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="mono text-sm font-semibold no-underline" style={{ color: "var(--text)" }}>
            {profile.handle}
          </Link>
          <nav className="mono flex items-center gap-6 text-sm" aria-label="Site">
            <Link href="/#work" className="no-underline hover:underline" style={{ color: "var(--muted)" }}>
              ~/work
            </Link>
            <Link href="/cv" className="no-underline hover:underline" style={{ color: "var(--muted)" }}>
              ~/cv
            </Link>
            <Link href="/#faq" className="no-underline hover:underline" style={{ color: "var(--muted)" }}>
              ~/faq
            </Link>
            <ThemeToggle />
            <a
              href={profile.bookingUrl}
              className="btn mono rounded px-4 py-1.5 text-sm font-semibold no-underline"
              style={{ background: "var(--accent)", color: "var(--on-accent)" }}
            >
              Book a call →
            </a>
          </nav>
        </div>
      </header>

      {/* Mobile top identity bar — subpages only (trunk test: whose site is this?) */}
      {!isHome ? (
        <div
          className="flex items-center justify-between border-b px-4 py-3 md:hidden"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <Link href="/" className="mono text-sm font-semibold no-underline" style={{ color: "var(--text)" }}>
            ~ {profile.handle}
          </Link>
          <ThemeToggle />
        </div>
      ) : null}

      {/* Mobile bottom CTA bar (≥44px tap target) */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t p-2 transition-transform duration-200 md:hidden ${
          visible ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        aria-hidden={!visible}
      >
        <div className="flex items-center gap-2">
          <div
            className="flex min-h-11 items-center rounded border px-3"
            style={{ borderColor: "var(--border)" }}
          >
            <ThemeToggle />
          </div>
          <a
            href={profile.bookingUrl}
            className="btn mono block min-h-11 flex-1 rounded py-3 text-center text-base font-semibold no-underline"
            style={{ background: "var(--accent)", color: "var(--on-accent)" }}
          >
            Book a call →
          </a>
        </div>
      </div>
    </div>
  );
}
