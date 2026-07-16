import type { Metadata } from "next";
import { profile } from "@/content/data/profile";
import { cvJsonLd, jsonLdScript } from "@/lib/jsonld";
import { PrintButton } from "@/components/PrintButton";

export const metadata: Metadata = {
  title: "CV",
  description: `CV of ${profile.name} (${profile.handle}) — ${profile.role} @ ${profile.company}, Full Stack Developer & AI Engineer with ${profile.yearsExperience} years of experience. Laravel, Vue, React, LLM integrations. ${profile.location}.`,
  alternates: { canonical: "/cv" },
};

/**
 * CV (SPEC §8): data-driven from profile.ts, print-perfect via @media print in globals.css.
 * ATS-safe: semantic HTML, standard section names, no text-in-images.
 */
export default function CvPage() {
  return (
    <main className="mx-auto max-w-3xl flex-1 px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(cvJsonLd()) }}
      />

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="mono h2-rule text-4xl font-semibold">{profile.name}</h1>
          <p className="mt-2 text-lg" style={{ color: "var(--muted)" }}>
            {profile.headline}
          </p>
          <p className="mono mt-2 text-sm" style={{ color: "var(--muted)" }}>
            {profile.location} · <a href={`mailto:${profile.email}`}>{profile.email}</a> ·{" "}
            <a href={profile.website}>adityadev.in</a> · <a href={profile.github}>github.com/{profile.handle}</a>
          </p>
        </div>
        <PrintButton />
      </header>

      <section className="mt-10">
        <h2 className="mono border-b pb-2 text-xl font-semibold" style={{ borderColor: "var(--border)" }}>
          Summary
        </h2>
        <p className="mt-4">
          {profile.role} at {profile.company} with {profile.yearsExperience} years of experience
          designing and shipping web products end to end — Laravel and PHP backends, Vue and React
          frontends, and production AI/LLM integrations. Led client projects from architecture to
          launch, including payments, real-estate platforms, and AI-powered automation. Based in{" "}
          {profile.location}; working with clients worldwide.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="mono border-b pb-2 text-xl font-semibold" style={{ borderColor: "var(--border)" }}>
          Experience
        </h2>
        {profile.experience.map((e) => (
          <div key={e.company} className="mt-5">
            <h3 className="text-lg font-semibold">
              {e.role} — {e.company}
            </h3>
            <p className="mono text-sm" style={{ color: "var(--muted)" }}>
              {e.period}
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {e.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="mt-10">
        <h2 className="mono border-b pb-2 text-xl font-semibold" style={{ borderColor: "var(--border)" }}>
          Skills
        </h2>
        <dl className="mt-4 space-y-3">
          {Object.entries(profile.skills).map(([group, items]) => (
            <div key={group} className="flex flex-col gap-1 sm:flex-row sm:gap-4">
              <dt className="mono w-40 shrink-0 text-sm font-medium" style={{ color: "var(--muted)" }}>
                {group}
              </dt>
              <dd>{items.join(" · ")}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-10">
        <h2 className="mono border-b pb-2 text-xl font-semibold" style={{ borderColor: "var(--border)" }}>
          Selected Projects
        </h2>
        <ul className="mt-4 space-y-3">
          <li>
            <strong>{profile.featuredWork.lead.title}</strong> — {profile.featuredWork.lead.story}{" "}
            <span className="mono text-sm" style={{ color: "var(--muted)" }}>
              ({profile.featuredWork.lead.stack})
            </span>
          </li>
          {profile.featuredWork.links.map((l) => (
            <li key={l.title}>
              <strong>{l.title}</strong> — {l.note}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="mono border-b pb-2 text-xl font-semibold" style={{ borderColor: "var(--border)" }}>
          Education
        </h2>
        <p className="mt-4">{profile.education}</p>
      </section>
    </main>
  );
}
