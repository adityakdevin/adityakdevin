import type { Metadata } from "next";
import { profile } from "@/content/data/profile";

export const metadata: Metadata = {
  title: "Hire",
  description: `Hire ${profile.name} (${profile.handle}) - ${profile.role}, Full Stack Developer & AI Engineer with ${profile.yearsExperience} years. Laravel, Node, Python, LLM integrations. Available for contract work worldwide.`,
  alternates: { canonical: "/hire" },
};

// Freelance marketplaces + direct channels, in preference order.
const channels = [
  { label: "Upwork", href: profile.upwork, note: "Hourly & fixed-scope contracts" },
  { label: "Freelancer", href: profile.freelancer, note: "Project bids, global" },
  { label: "PeoplePerHour", href: profile.peopleperhour, note: "EU/UK-friendly gigs" },
  { label: "LinkedIn", href: profile.linkedin, note: "Career history & referrals" },
] as const;

export default function HirePage() {
  return (
    <main className="mx-auto max-w-3xl flex-1 px-6 py-16">
      <header>
        <h1 className="mono h2-rule text-4xl font-semibold">Hire me</h1>
        <p className="mt-3 text-lg" style={{ color: "var(--muted)" }}>
          {profile.valueLine} {profile.yearsExperience} years shipping Laravel, Node, Python, and
          production AI/LLM features - backend to pixels. Available for contract work worldwide.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={profile.bookingUrl}
            className="btn mono rounded px-4 py-2 text-sm font-semibold no-underline"
            style={{ background: "var(--accent)", color: "var(--on-accent)" }}
          >
            Book a call →
          </a>
          <a
            href={`mailto:${profile.email}`}
            className="mono rounded border px-4 py-2 text-sm font-semibold no-underline"
            style={{ borderColor: "var(--border)" }}
          >
            {profile.email}
          </a>
        </div>
      </header>

      <section className="mt-12">
        <h2 className="mono border-b pb-2 text-xl font-semibold" style={{ borderColor: "var(--border)" }}>
          What I do
        </h2>
        <div className="mt-5 space-y-6">
          {profile.services.map((s) => (
            <div key={s.n}>
              <h3 className="text-lg font-semibold">
                <span className="mono mr-2" style={{ color: "var(--muted)" }}>
                  {s.n}
                </span>
                {s.title}
              </h3>
              <p className="mt-1" style={{ color: "var(--muted)" }}>
                {s.claim}
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {s.lines.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="mono border-b pb-2 text-xl font-semibold" style={{ borderColor: "var(--border)" }}>
          Where to hire me
        </h2>
        <ul className="mt-4 space-y-3">
          {channels.map((c) => (
            <li key={c.label} className="flex flex-wrap items-baseline gap-x-3">
              <a href={c.href} className="mono font-semibold">
                {c.label} →
              </a>
              <span className="text-sm" style={{ color: "var(--muted)" }}>
                {c.note}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm" style={{ color: "var(--muted)" }}>
          Prefer to work direct? Email or book a call above - same me, no marketplace fees.
        </p>
      </section>
    </main>
  );
}
