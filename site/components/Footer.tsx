import Link from "next/link";
import { profile } from "@/content/data/profile";
import { publishedCaseStudies } from "@/content/data/work";

// The footer is the only place /now, /uses and the three service pages are
// linked from at all, and the only path to /hire on mobile from the homepage.
// /work is gated on the same >=2 rule its own page and the sitemap use - it 404s
// below that, and a footer on every route must not link to a 404.
const siteLinks = [
  { label: "Blog", href: "/blog" },
  { label: "Hire me", href: "/hire" },
  ...(publishedCaseStudies.length >= 2 ? [{ label: "Work", href: "/work" }] : []),
  { label: "AI audit", href: "/services/ai-integration-audit" },
  { label: "Laravel + AI", href: "/services/laravel-ai-development" },
  { label: "Node + AI", href: "/services/nodejs-ai-development" },
  { label: "Python + AI", href: "/services/python-ai-development" },
  { label: "Now", href: "/now" },
  { label: "Uses", href: "/uses" },
];

const links = [
  { label: "GitHub", href: profile.github },
  { label: "LinkedIn", href: profile.linkedin },
  { label: "X", href: profile.twitter },
  { label: "Upwork", href: profile.upwork },
  { label: "Freelancer", href: profile.freelancer },
  { label: "PeoplePerHour", href: profile.peopleperhour },
  { label: "Dev.to", href: profile.devto },
];

export function Footer() {
  return (
    <footer
      data-no-print
      className="mt-24 border-t"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between md:gap-10">
          <div>
            <p className="mono text-sm" style={{ color: "var(--muted)" }}>
              <span style={{ color: "var(--accent)" }}>$</span> whoami →{" "}
              <span style={{ color: "var(--text)" }}>{profile.name}</span>
            </p>
            <a
              href={`mailto:${profile.email}`}
              className="mono mt-1 inline-block text-sm"
              style={{ color: "var(--accent)" }}
            >
              {profile.email} →
            </a>
          </div>

          <div className="flex flex-col gap-4 md:items-end">
            <nav className="mono flex flex-wrap gap-x-5 text-sm md:justify-end" aria-label="Site">
              {siteLinks.map((l) => (
                <Link key={l.label} href={l.href} className="py-1">
                  {l.label}
                </Link>
              ))}
            </nav>
            <nav
              className="mono flex flex-wrap gap-x-5 text-sm md:justify-end"
              aria-label="Elsewhere"
            >
              {links.map((l) => (
                <a key={l.label} href={l.href} className="py-1">
                  {l.label}
                </a>
              ))}
            </nav>
          </div>
        </div>

        <div
          className="mt-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t pt-4 text-xs"
          style={{ borderColor: "var(--border)", color: "var(--muted)" }}
        >
          <p>
            (C) {new Date().getFullYear()} {profile.name} ({profile.handle}) · Full Stack Developer
            &amp; AI Engineer · {profile.location}
          </p>
          <Link href="/privacy">Privacy</Link>
        </div>
      </div>
    </footer>
  );
}
