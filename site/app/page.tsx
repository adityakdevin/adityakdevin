import Link from "next/link";
import { profile } from "@/content/data/profile";
import { faq } from "@/content/data/faq";
import { getLatestPosts } from "@/lib/devto";
import { withRef } from "@/lib/site";
import { getAllPosts, mergeFieldNotes } from "@/lib/posts";
import { publishedCaseStudies } from "@/content/data/work";
import {
  personJsonLd,
  profilePageJsonLd,
  faqJsonLd,
  jsonLdScript,
} from "@/lib/jsonld";
import { Hero } from "@/components/Hero";
import { ContactForm } from "@/components/ContactForm";
import { ServiceStackNav } from "@/components/ServiceStackNav";

// Same gate the index, sitemap, footer and nav use - below it, /work 404s.
const MIN_WORK_INDEX = 2;

function Eyebrow({ cmd }: { cmd: string }) {
  return (
    <p className="mono mb-3 text-sm" style={{ color: "var(--muted)" }}>
      <span style={{ color: "var(--accent)" }}>$</span> {cmd}
    </p>
  );
}

function H2({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h2 id={id} className="mono h-section h2-rule scroll-mt-20 tracking-tight">
      {children}
    </h2>
  );
}

export default async function Home() {
  // Local site-first posts merge with the Dev.to legacy feed, deduped by
  // devtoId - Dev.to being down no longer empties this section (T5).
  // 4, not 3: the notes render as a two-column grid, so an odd count leaves a
  // hole in the last row. Five local posts exist.
  const notes = mergeFieldNotes(getAllPosts(), await getLatestPosts(3), 4);

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
      <section
        className="border-b"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        {/* Reveal deleted: the class was added AFTER paint with
            animation-fill-mode: both, so the strip snapped to opacity 0 and faded
            back in - the site's only entrance animation read as a flicker. */}
        {/* A band, not four floating pairs: each figure gets its own cell with a
            rule between them, so the row reads as one object under the hero. */}
        <div className="mx-auto grid max-w-5xl grid-cols-2 px-6 md:grid-cols-4">
          {profile.metrics.map((m, i) => (
            <div
              key={m.label}
              className={`px-2 py-7 md:px-6 md:py-9 ${i % 2 === 1 ? "border-l" : ""} ${
                i >= 2 ? "border-t md:border-t-0" : ""
              } ${i === 2 ? "md:border-l" : ""} ${i === 3 ? "md:border-l" : ""}`}
              style={{ borderColor: "var(--border)" }}
            >
              <div
                className="mono text-4xl font-semibold md:text-5xl"
                style={{ color: "var(--accent)" }}
              >
                {m.value}
              </div>
              <div
                className="mono mt-2 text-xs tracking-widest uppercase"
                style={{ color: "var(--muted)" }}
              >
                {m.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3 - Services: numbered editorial rows, NOT cards; non-interactive at P1a */}
      <section className="mx-auto max-w-5xl px-6 py-14 md:py-16">
        <Eyebrow cmd="ls services/" />
        <H2>I ship AI features into production apps</H2>
        <div
          className="mt-10 space-y-0 divide-y"
          style={{ borderColor: "var(--border)" }}
        >
          {profile.services.map((s) => (
            <div
              key={s.n}
              className="grid gap-3 py-8 md:grid-cols-[64px_240px_1fr] md:gap-8"
            >
              <span className="mono text-sm" style={{ color: "var(--accent)" }}>
                {s.n}
              </span>
              <h3 className="text-xl font-medium">{s.title}</h3>
              <div>
                <p className="font-medium">{s.claim}</p>
                {s.lines.map((line) => (
                  <p
                    key={line}
                    className="mt-1 text-base"
                    style={{ color: "var(--muted)" }}
                  >
                    {line}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
        {/* The service cluster's only inbound link from the homepage - without it
            the three /services/* pages ship at sitemap priority 0.9 orphaned. */}
        <ServiceStackNav className="mt-8" />
      </section>

      {/* 4 - Featured work: ONE lead narrative + compact links (cards return in P2 when clickable) */}
      <section
        id="work"
        className="scroll-mt-20 border-y"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <div className="mx-auto max-w-5xl px-6 py-14 md:py-16">
          <Eyebrow cmd="cat work/lead.md" />
          <H2>Proof: systems that run businesses</H2>
          <div className="mt-10 grid gap-10 md:grid-cols-[3fr_2fr]">
            <article>
              <h3 className="text-xl font-medium">
                <Link href="/work/budgetgen">
                  {profile.featuredWork.lead.title}
                </Link>
              </h3>
              <p className="mt-3" style={{ color: "var(--muted)" }}>
                {profile.featuredWork.lead.story}
              </p>
              <p
                className="mono mt-3 text-sm"
                style={{ color: "var(--accent)" }}
              >
                {profile.featuredWork.lead.stack}
              </p>
              {profile.featuredWork.lead.metric ? (
                <p className="mono mt-3 text-sm">
                  <span
                    className="font-semibold"
                    style={{ color: "var(--accent)" }}
                  >
                    {profile.featuredWork.lead.metric.value}
                  </span>{" "}
                  <span style={{ color: "var(--muted)" }}>
                    {profile.featuredWork.lead.metric.label}
                  </span>
                </p>
              ) : null}
            </article>
            <div
              className="space-y-6 md:border-l md:pl-8"
              style={{ borderColor: "var(--border)" }}
            >
              {/* The section summarised an index it never linked to: /work was
                  reachable only from the footer. */}
              {publishedCaseStudies.length >= MIN_WORK_INDEX ? (
                <Link href="/work" className="mono text-base font-medium">
                  All {publishedCaseStudies.length} case studies&nbsp;→
                </Link>
              ) : null}
              {profile.featuredWork.links.map((l) => (
                <div key={l.title}>
                  <a href={l.href} className="mono text-base font-medium">
                    {l.title}&nbsp;→
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
      <section className="mx-auto max-w-5xl px-6 py-14 md:py-16">
        <Eyebrow cmd="checksum --verify claims" />
        <H2>Verify me yourself</H2>
        <p className="mt-3 max-w-2xl" style={{ color: "var(--muted)" }}>
          Don&apos;t take my word for any of this - every claim below links to a
          source you can check in ten seconds.
        </p>
        {/* Cards in two columns: as a single-file list this used half the
            column width and read as the least important block on the page,
            which is backwards - it is the proof. */}
        <ul className="mt-8 grid gap-3 md:grid-cols-2">
          {profile.verify.map((v) => (
            <li
              key={v.claim}
              className="rounded border p-4"
              style={{
                borderColor: "var(--border)",
                background: "var(--surface)",
              }}
            >
              <span className="mono text-sm" style={{ color: "var(--accent)" }}>
                [ok]
              </span>
              <a href={v.href} className="mt-1 block font-medium">
                {v.claim}
              </a>
              <span
                className="mt-1 block text-sm"
                style={{ color: "var(--muted)" }}
              >
                {v.note}
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
                style={{
                  borderColor: "var(--border)",
                  background: "var(--surface)",
                }}
              >
                <p className="italic">&ldquo;{t.quote}&rdquo;</p>
                <footer
                  className="mono mt-3 text-sm"
                  style={{ color: "var(--muted)" }}
                >
                  - {t.author}, {t.role}
                </footer>
              </blockquote>
            ))}
          </div>
        ) : null}
      </section>

      {/* 6 - Writing: local posts + Dev.to legacy merged (T5); hides only when BOTH are empty */}
      {notes.length > 0 ? (
        <section
          className="border-y"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        >
          <div className="mx-auto max-w-5xl px-6 py-14 md:py-16">
            <Eyebrow cmd="ls -la ~/writing" />
            <H2>Field notes from Laravel + AI work</H2>
            {/* Three dated links in a thin left strip used a third of the
                column. Two columns, each note its own bordered row. */}
            <ul className="mono mt-8 grid gap-3 md:grid-cols-2">
              {notes.map((n) => (
                <li
                  key={n.key}
                  className="rounded border p-4"
                  style={{
                    borderColor: "var(--border)",
                    background: "var(--bg)",
                  }}
                >
                  <span
                    className="block text-sm"
                    style={{ color: "var(--muted)" }}
                  >
                    {n.date}
                  </span>
                  {n.href.startsWith("/") ? (
                    <Link
                      href={n.href}
                      className="mt-1 block text-base font-medium"
                    >
                      {n.title}
                    </Link>
                  ) : (
                    <a
                      href={n.href}
                      className="mt-1 block text-base font-medium"
                    >
                      {n.title}
                    </a>
                  )}
                  {/* Local posts carry a summary; the legacy Dev.to feed does
                      not, so the card degrades to title-only rather than
                      inventing one. */}
                  {n.description ? (
                    <p
                      className="mt-2 text-sm leading-relaxed"
                      style={{
                        color: "var(--muted)",
                        fontFamily: "var(--font-plex-sans)",
                      }}
                    >
                      {n.description}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
            <p className="mono mt-6 text-sm">
              <Link href="/blog">all field notes&nbsp;→</Link>
            </p>
          </div>
        </section>
      ) : null}

      {/* 7 - FAQ (single source: faq.ts → section + JSON-LD + bot) */}
      <section
        id="faq"
        className="mx-auto max-w-5xl scroll-mt-20 px-6 py-14 md:py-16"
      >
        <Eyebrow cmd="man hiring-aditya" />
        <H2>Before you book</H2>
        {/* The constraint moves off the wrapper and onto the answer text: the
            cards now align with every other section, while the prose keeps a
            readable measure instead of running to ~113 characters. */}
        <div className="mt-8 space-y-3">
          {faq.map((item, i) => (
            <details
              key={item.q}
              // The site's only price sits in faq[1]; open it so it is not behind
              // a guess-which-of-six click. Server component, no handler.
              open={i === 1}
              className="group rounded border"
              style={{
                borderColor: "var(--border)",
                background: "var(--surface)",
              }}
            >
              <summary className="mono min-h-11 cursor-pointer list-none px-5 py-3.5 font-medium marker:content-none">
                <span style={{ color: "var(--accent)" }}>?</span> {item.q}
              </summary>
              <p
                className="max-w-2xl px-5 pb-5 pt-1"
                style={{ color: "var(--muted)" }}
              >
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
        <div className="mx-auto max-w-5xl px-6 py-14 md:py-16">
          <Eyebrow cmd="./start-project.sh" />
          <H2>Let&apos;s build your next system</H2>
          {/* One bordered object split down the middle, instead of a button
              floating next to a bare form on a flat background. */}
          <div
            // 1fr_1fr, was 2fr_3fr: at 2fr the left panel gave the CTA label 277px for
            // the 283px it needs, so the primary button wrapped by 7px at 1440 and by
            // 56px at 900. The numbered steps were wrapping to four lines for the same
            // reason. The form does not need the extra third.
            className="mt-10 grid overflow-hidden rounded border lg:grid-cols-[1fr_1fr]"
            style={{ borderColor: "var(--border)", background: "var(--bg)" }}
          >
            {/* justify-between: the panel stretches to the form's height, so
                left-aligned content left a 155px hole under the links. Booking
                sits at the top, the direct-contact list anchors the bottom. */}
            <div
              className="flex flex-col justify-between border-b p-6 lg:border-r lg:border-b-0 lg:p-8"
              style={{ borderColor: "var(--border)" }}
            >
              <div>
                <a
                  href={withRef(profile.bookingUrl, "home")}
                  // Sized to fit on one line at every width: the label needs 283px at 18px,
                  // which the panel only gives it from 768 up. Phones get 16px type and
                  // tighter padding so it still fits rather than wrapping.
                  className="btn mono block min-h-11 rounded px-4 py-4 text-center text-base font-semibold no-underline lg:px-6 lg:text-lg"
                  style={{
                    background: "var(--accent)",
                    color: "var(--on-accent)",
                  }}
                >
                  {/* nbsp binds the arrow to the last word: the label wraps in
                      this panel and the arrow was landing alone on line two.
                      Not whitespace-nowrap - at 390px the label is wider than
                      the panel, so nowrap would overflow instead of wrap. */}
                  Book a free 30-min call&nbsp;→
                </a>
                <p className="mt-4 text-sm" style={{ color: "var(--muted)" }}>
                  The fastest path - come with the problem, leave with a plan.
                </p>
              </div>
              {/* Fills the panel with the thing a buyer wants next instead of
                  redistributing empty space. Every line restates a promise the
                  site already makes: the 24-hour reply is ContactForm's success
                  panel, the call and the fixed quote are PROCESS steps 01 and
                  02 in content/data/services.ts. No new claims. */}
              <ol
                className="mono mt-6 space-y-3 text-sm"
                style={{ color: "var(--muted)" }}
              >
                {[
                  "You hear back within 24 hours.",
                  "A 30-minute call: you describe the problem, I tell you honestly whether AI helps.",
                  "A fixed-scope quote before any work starts.",
                ].map((step, i) => (
                  <li key={step} className="flex gap-3">
                    <span
                      style={{ color: "var(--accent)" }}
                    >{`0${i + 1}`}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
              <ul
                className="mono mt-8 space-y-2 border-t pt-6 text-sm"
                style={{ borderColor: "var(--border)" }}
              >
                <li>
                  <a href={`mailto:${profile.email}`}>{profile.email}</a>
                </li>
                {profile.phone ? (
                  <li>
                    <a href={`tel:${profile.phone.replace(/\s/g, "")}`}>
                      {profile.phone}
                    </a>
                  </li>
                ) : null}
                <li>
                  <a href={profile.linkedin}>LinkedIn</a> ·{" "}
                  <a href={profile.github}>GitHub</a> ·{" "}
                  <a href={profile.twitter}>X</a>
                </li>
              </ul>
            </div>
            <div className="p-6 lg:p-8">
              <p
                className="mono mb-4 text-sm"
                style={{ color: "var(--muted)" }}
              >
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
