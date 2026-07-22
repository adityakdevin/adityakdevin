import type { Metadata } from "next";
import { profile } from "@/content/data/profile";
import { ContactForm } from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Hire",
  description: `Hire ${profile.name} (${profile.handle}) - ${profile.role}, Full Stack Developer & AI Engineer with ${profile.yearsExperience} years. Laravel, Node, Python, LLM integrations. Available for contract work worldwide.`,
  alternates: { canonical: "/hire" },
};

// /hire-specific wedge (design D1): the sharp Laravel+AI line lives here, at the
// conversion point. Global profile.headline/valueLine stay broad (home, JSON-LD,
// llms.txt, bot corpus keep full-stack breadth). See ceo-plan row 3.
const HIRE_WEDGE = "I ship production AI/LLM features into Laravel & Node apps - not demos.";

// Freelance marketplaces + direct channels, in preference order.
const channels = [
  { label: "Upwork", href: profile.upwork, note: "Hourly & fixed-scope contracts" },
  { label: "Freelancer", href: profile.freelancer, note: "Project bids, global" },
  { label: "PeoplePerHour", href: profile.peopleperhour, note: "EU/UK-friendly gigs" },
  { label: "LinkedIn", href: profile.linkedin, note: "Career history & referrals" },
] as const;

const sectionHead = "mono border-b pb-2 text-xl font-semibold";

export default function HirePage() {
  return (
    <main className="mx-auto max-w-3xl flex-1 px-6 py-16">
      {/* Header - the hook: wedge line + high-intent CTAs */}
      <header>
        <h1 className="mono h2-rule text-4xl font-semibold">Hire me</h1>
        <p className="mt-3 text-lg font-medium">{HIRE_WEDGE}</p>
        <p className="mt-2" style={{ color: "var(--muted)" }}>
          {profile.yearsExperience} years shipping Laravel, Node, Python, and production AI/LLM
          features - backend to pixels. Available for contract work worldwide.
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

      {/* Proof - sits ABOVE the pitch so trust lands before services (design D1).
          Testimonials render only when populated; featured work always shows. */}
      <section className="mt-12">
        <h2 className={sectionHead} style={{ borderColor: "var(--border)" }}>
          Proof
        </h2>
        {profile.testimonials.length > 0 ? (
          <div className="mt-5 grid gap-6 md:grid-cols-2">
            {profile.testimonials.map((t) => (
              <blockquote
                key={t.author}
                className="rounded border p-6"
                style={{ borderColor: "var(--border)", background: "var(--surface)" }}
              >
                <p className="italic">&ldquo;{t.quote}&rdquo;</p>
                <footer className="mono mt-3 text-sm" style={{ color: "var(--muted)" }}>
                  - {t.author}, {t.role}
                </footer>
              </blockquote>
            ))}
          </div>
        ) : null}
        <div className="mt-5">
          <h3 className="text-lg font-medium">{profile.featuredWork.lead.title}</h3>
          <p className="mt-1" style={{ color: "var(--muted)" }}>
            {profile.featuredWork.lead.story}
          </p>
          <p className="mono mt-2 text-sm" style={{ color: "var(--accent)" }}>
            {profile.featuredWork.lead.stack}
          </p>
        </div>
        <ul className="mt-5 space-y-3">
          {profile.featuredWork.links.map((l) => (
            <li key={l.title}>
              <a href={l.href} className="mono text-base font-medium">
                {l.title} →
              </a>
              <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                {l.note}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* What I do */}
      <section className="mt-12">
        <h2 className={sectionHead} style={{ borderColor: "var(--border)" }}>
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

      {/* Where to hire me */}
      <section className="mt-12">
        <h2 className={sectionHead} style={{ borderColor: "var(--border)" }}>
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

      {/* Send the project details - low-friction catch at the decision point,
          after proof. Reuses ContactForm's full state coverage (design D1). */}
      <section className="mt-12">
        <h2 className={sectionHead} style={{ borderColor: "var(--border)" }}>
          Send the project details
        </h2>
        <p className="mono mt-4 mb-4 text-sm" style={{ color: "var(--muted)" }}>
          Not ready to book a call? Tell me about the project and I&apos;ll reply.
        </p>
        <ContactForm />
      </section>
    </main>
  );
}
