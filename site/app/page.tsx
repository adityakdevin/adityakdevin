import Link from "next/link";
import { profile } from "@/content/data/profile";
import { faq } from "@/content/data/faq";
import { getLatestPosts } from "@/lib/devto";
import { withRef } from "@/lib/site";
import { getAllPosts, mergeFieldNotes } from "@/lib/posts";
import { personJsonLd, profilePageJsonLd, faqJsonLd, jsonLdScript } from "@/lib/jsonld";
import { Hero } from "@/components/Hero";
import { Reveal } from "@/components/Reveal";
import { ContactForm } from "@/components/ContactForm";

function Eyebrow({ cmd }: { cmd: string }) {
  return (
    <p className="mono mb-3 text-sm" style={{ color: "var(--muted)" }}>
      <span style={{ color: "var(--accent)" }}>$</span> {cmd}
    </p>
  );
}

function H2({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h2 id={id} className="mono h2-rule scroll-mt-20 text-3xl font-semibold tracking-tight md:text-4xl">
      {children}
    </h2>
  );
}

export default async function Home() {
  // Local site-first posts merge with the Dev.to legacy feed, deduped by
  // devtoId - Dev.to being down no longer empties this section (T5).
  const notes = mergeFieldNotes(getAllPosts(), await getLatestPosts(3));

  return (
    <main className="flex-1">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(personJsonLd()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(profilePageJsonLd()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(faqJsonLd()) }}
      />

      <Hero />

      {/* 2 - Metric strip: one inline strip, no tile boxes; static build-time numbers */}
      <section className="border-b" style={{ borderColor: "var(--border)" }}>
        <Reveal>
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-x-6 gap-y-6 px-6 py-9 md:flex md:items-baseline md:justify-between md:py-10">
            {profile.metrics.map((m) => (
              <div key={m.label} className="flex items-baseline gap-2">
                <span className="mono text-4xl font-semibold md:text-5xl" style={{ color: "var(--accent)" }}>
                  {m.value}
                </span>
                <span className="text-sm" style={{ color: "var(--muted)" }}>
                  {m.label}
                </span>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* 3 - Services: numbered editorial rows, NOT cards; non-interactive at P1a */}
      <section className="mx-auto max-w-5xl px-6 py-20 md:py-24">
        <Eyebrow cmd="ls services/" />
        <H2>I ship AI features into production apps</H2>
        <div className="mt-10 space-y-0 divide-y" style={{ borderColor: "var(--border)" }}>
          {profile.services.map((s) => (
            <div key={s.n} className="grid gap-3 py-8 md:grid-cols-[64px_240px_1fr] md:gap-8">
              <span className="mono text-sm" style={{ color: "var(--accent)" }}>
                {s.n}
              </span>
              <h3 className="text-xl font-medium">{s.title}</h3>
              <div>
                <p className="font-medium">{s.claim}</p>
                {s.lines.map((line) => (
                  <p key={line} className="mt-1 text-base" style={{ color: "var(--muted)" }}>
                    {line}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4 - Featured work: ONE lead narrative + compact links (cards return in P2 when clickable) */}
      <section
        id="work"
        className="scroll-mt-20 border-y"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <div className="mx-auto max-w-5xl px-6 py-20 md:py-24">
          <Eyebrow cmd="cat work/lead.md" />
          <H2>Proof: systems that run businesses</H2>
          <div className="mt-10 grid gap-10 md:grid-cols-[3fr_2fr]">
            <article>
              <h3 className="text-xl font-medium">
                <Link href="/work/budgetgen">{profile.featuredWork.lead.title}</Link>
              </h3>
              <p className="mt-3" style={{ color: "var(--muted)" }}>
                {profile.featuredWork.lead.story}
              </p>
              <p className="mono mt-3 text-sm" style={{ color: "var(--accent)" }}>
                {profile.featuredWork.lead.stack}
              </p>
            </article>
            <div className="space-y-6 md:border-l md:pl-8" style={{ borderColor: "var(--border)" }}>
              {profile.featuredWork.links.map((l) => (
                <div key={l.title}>
                  <a href={l.href} className="mono text-base font-medium">
                    {l.title} →
                  </a>
                  <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                    {l.note}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5 - Trust beat: externally verifiable claims; testimonial slot ships hidden */}
      <section className="mx-auto max-w-5xl px-6 py-20 md:py-24">
        <Eyebrow cmd="checksum --verify claims" />
        <H2>Verify me yourself</H2>
        <p className="mt-3 max-w-2xl" style={{ color: "var(--muted)" }}>
          Don&apos;t take my word for any of this - every claim below links to a source you can
          check in ten seconds.
        </p>
        <ul className="mt-8 space-y-4">
          {profile.verify.map((v) => (
            <li key={v.claim} className="flex flex-wrap items-baseline gap-2">
              <span className="mono" style={{ color: "var(--accent)" }}>
                
              </span>
              <a href={v.href} className="font-medium">
                {v.claim}
              </a>
              <span className="text-sm" style={{ color: "var(--muted)" }}>
                - {v.note}
              </span>
            </li>
          ))}
        </ul>
        {profile.testimonials.length > 0 ? (
          <div className="mt-10 grid gap-6 md:grid-cols-2">
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
      </section>

      {/* 6 - Writing: local posts + Dev.to legacy merged (T5); hides only when BOTH are empty */}
      {notes.length > 0 ? (
        <section className="border-y" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <div className="mx-auto max-w-5xl px-6 py-20 md:py-24">
            <Eyebrow cmd="ls -la ~/writing" />
            <H2>Field notes from Laravel + AI work</H2>
            <ul className="mono mt-8 space-y-4">
              {notes.map((n) => (
                <li key={n.key} className="flex flex-col gap-1 md:flex-row md:items-baseline md:gap-6">
                  <span className="shrink-0 text-sm" style={{ color: "var(--muted)" }}>
                    {n.date}
                  </span>
                  {n.href.startsWith("/") ? (
                    <Link href={n.href} className="text-base font-medium">
                      {n.title}
                    </Link>
                  ) : (
                    <a href={n.href} className="text-base font-medium">
                      {n.title}
                    </a>
                  )}
                </li>
              ))}
            </ul>
            <p className="mono mt-6 text-sm">
              <Link href="/blog">all field notes →</Link>
            </p>
          </div>
        </section>
      ) : null}

      {/* 7 - FAQ (single source: faq.ts → section + JSON-LD + bot) */}
      <section id="faq" className="mx-auto max-w-5xl scroll-mt-20 px-6 py-20 md:py-24">
        <Eyebrow cmd="man hiring-aditya" />
        <H2>Before you book</H2>
        <div className="mt-8 max-w-3xl space-y-3">
          {faq.map((item) => (
            <details
              key={item.q}
              className="group rounded border"
              style={{ borderColor: "var(--border)", background: "var(--surface)" }}
            >
              <summary className="mono min-h-11 cursor-pointer list-none px-5 py-3.5 font-medium marker:content-none">
                <span style={{ color: "var(--accent)" }}>?</span> {item.q}
              </summary>
              <p className="px-5 pb-5 pt-1" style={{ color: "var(--muted)" }}>
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* 8 - Contact / booking */}
      <section
        id="contact"
        className="scroll-mt-20 border-t"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <div className="mx-auto max-w-5xl px-6 py-20 md:py-24">
          <Eyebrow cmd="./start-project.sh" />
          <H2>Let&apos;s build your next system</H2>
          <div className="mt-10 grid gap-12 md:grid-cols-[2fr_3fr]">
            <div>
              <a
                href={withRef(profile.bookingUrl, "home")}
                className="btn mono block min-h-11 rounded px-6 py-4 text-center text-lg font-semibold no-underline"
                style={{ background: "var(--accent)", color: "var(--on-accent)" }}
              >
                Book a free 30-min call →
              </a>
              <p className="mt-4 text-sm" style={{ color: "var(--muted)" }}>
                The fastest path - come with the problem, leave with a plan.
              </p>
              <ul className="mono mt-8 space-y-2 text-sm">
                <li>
                  <a href={`mailto:${profile.email}`}>{profile.email}</a>
                </li>
                {profile.phone ? <li>{profile.phone}</li> : null}
                <li>
                  <a href={profile.linkedin}>LinkedIn</a> · <a href={profile.github}>GitHub</a> ·{" "}
                  <a href={profile.twitter}>X</a>
                </li>
              </ul>
            </div>
            <div>
              <p className="mono mb-4 text-sm" style={{ color: "var(--muted)" }}>
                or leave a message:
              </p>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
