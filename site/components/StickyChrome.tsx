"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { profile } from "@/content/data/profile";
import { withRef } from "@/lib/site";
import { ThemeToggle } from "@/components/ThemeToggle";

/* Brand mark - same >_ tile as the PWA icon, sized for chrome bars */
function Logo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <rect width="24" height="24" rx="5.5" fill="#0d1117" stroke="#30363d" />
      <polyline
        points="7,7.9 11.4,12 7,16.1"
        fill="none"
        stroke="#22b8d4"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="13.2" y="15.2" width="5.3" height="1.9" rx="0.6" fill="#22b8d4" />
    </svg>
  );
}

/* Tab-bar building blocks - 20px stroke icons, 10px mono labels, top indicator on active */
function Tab({
  href,
  label,
  active,
  children,
}: {
  href: string;
  label: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className="relative flex min-h-16 flex-col items-center justify-center gap-1 no-underline"
      style={{ color: active ? "var(--accent)" : "var(--muted)" }}
    >
      {active ? (
        <span
          aria-hidden
          className="absolute top-0 h-0.5 w-8 rounded-full"
          style={{ background: "var(--accent)" }}
        />
      ) : null}
      {children}
      <span className="text-[10px]">{label}</span>
    </Link>
  );
}

const iconProps = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

function HomeIcon() {
  return (
    <svg {...iconProps}>
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v11h14V10" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg {...iconProps}>
      <path d="m8 7-5 5 5 5" />
      <path d="m16 7 5 5-5 5" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg {...iconProps}>
      <path d="M14 2H6v20h12V6z" />
      <path d="M14 2v4h4" />
      <path d="M9 13h6M9 17h6" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}

/**
 * Global chrome (SPEC S5, design review 3A + FINDING-001):
 * - Home: header appears after scrolling past the hero (the hero IS the identity).
 * - Every other page: header visible immediately - trunk test requires site ID + nav on landing.
 * - Mobile: fixed bottom tab bar (native-app nav) - always visible, safe-area aware.
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
          <Link
            href="/"
            className="mono flex items-center gap-2 text-sm font-semibold no-underline"
            style={{ color: "var(--text)" }}
          >
            <Logo />
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
              href={withRef(profile.bookingUrl, "nav")}
              className="btn mono rounded px-4 py-1.5 text-sm font-semibold no-underline"
              style={{ background: "var(--accent)", color: "var(--on-accent)" }}
            >
              Book a call →
            </a>
          </nav>
        </div>
      </header>

      {/* Mobile top identity bar - subpages only (trunk test: whose site is this?) */}
      {!isHome ? (
        <div
          className="flex items-center justify-between border-b px-4 py-3 md:hidden"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <Link
            href="/"
            className="mono flex min-h-11 items-center gap-2 text-sm font-semibold no-underline"
            style={{ color: "var(--text)" }}
          >
            <Logo />
            {profile.handle}
          </Link>
        </div>
      ) : null}

      {/* Mobile bottom tab bar - native-app nav: icon+label tabs, active indicator, notch-safe */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
        style={{
          background: "color-mix(in srgb, var(--surface) 88%, transparent)",
          borderColor: "var(--border)",
        }}
        aria-label="Site"
      >
        {/* Theme toggle removed from mobile nav (2026-07-17) - mobile follows
            prefers-color-scheme; the freed slot widens the booking CTA. */}
        <div className="mono grid grid-cols-5 items-stretch">
          <Tab href="/" label="home" active={isHome}>
            <HomeIcon />
          </Tab>
          <Tab href="/#work" label="work" active={false}>
            <CodeIcon />
          </Tab>
          <Tab href="/cv" label="cv" active={pathname === "/cv"}>
            <FileIcon />
          </Tab>
          <a
            href={withRef(profile.bookingUrl, "nav")}
            className="btn col-span-2 m-2 flex flex-row items-center justify-center gap-1.5 rounded-lg no-underline"
            style={{ background: "var(--accent)", color: "var(--on-accent)" }}
          >
            <CalendarIcon />
            <span className="text-xs font-semibold">book a call</span>
          </a>
        </div>
      </nav>
    </div>
  );
}
