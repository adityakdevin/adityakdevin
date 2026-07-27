import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { publishedCaseStudies } from "@/content/data/work";
import { jsonLdScript } from "@/lib/jsonld";
import { SITE_URL } from "@/lib/site";

// Thin-index guard (ceo-plan D2 + CEO mitigation): the index only exists once
// there are >=2 published studies. Below that it 404s, so a one-entry index of a
// single personal project never goes live or gets indexed.
const MIN_STUDIES = 2;

export const metadata: Metadata = {
  title: "Work",
  description: "Case studies - real systems designed, built, and shipped.",
  alternates: { canonical: "/work" },
};

// Newest first. The index had no sort order at all, so it rendered in whatever
// order the data file happened to be written in.
const sortedStudies = [...publishedCaseStudies].sort((a, b) =>
  b.date.localeCompare(a.date),
);

export default function WorkIndexPage() {
  if (publishedCaseStudies.length < MIN_STUDIES) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${SITE_URL}/work#worklist`,
    itemListElement: sortedStudies.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/work/${c.slug}`,
      name: c.title,
    })),
  };

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }}
      />
      <p className="mono mb-3 text-sm" style={{ color: "var(--muted)" }}>
        <span style={{ color: "var(--accent)" }}>aditya@dev</span>:~$ ls work/
      </p>
      <h1 className="mono h2-rule text-4xl font-semibold">Work</h1>

      <ul className="mt-10 space-y-5">
        {sortedStudies.map((c) => {
          const lead = c.outcome?.[0];
          // The card's visual is the study's own architecture diagram, cropped -
          // real content, not decoration, and it survives an NDA the way a
          // screenshot would not. Studies without one just render without it.
          const diagram = c.sections
            .find((sec) => sec.pre)
            ?.pre?.split("\n")
            .slice(0, 6)
            .join("\n");
          return (
            <li
              key={c.slug}
              className="overflow-hidden rounded border"
              style={{
                borderColor: "var(--border)",
                background: "var(--surface)",
              }}
            >
              {/* Two tracks only when there is a diagram to put in the second
                  one - an unconditional 3fr_2fr squeezed a diagram-less study
                  into 60% of the card and left the other 40% blank. */}
              <div
                className={`grid ${diagram ? "md:grid-cols-[3fr_2fr]" : ""}`}
              >
                <div className="p-6">
                  {/* The sort is newest-first; without the date the reader
                      cannot see that, and `date` exists only to drive it. */}
                  <p className="mono text-sm" style={{ color: "var(--muted)" }}>
                    {c.date}
                  </p>
                  <h2 className="mt-1 text-xl font-medium">
                    <Link href={`/work/${c.slug}`}>{c.title}</Link>
                  </h2>
                  {c.client || c.period ? (
                    <p
                      className="mono mt-1 text-sm"
                      style={{ color: "var(--muted)" }}
                    >
                      {[c.client, c.period].filter(Boolean).join(" · ")}
                    </p>
                  ) : null}
                  <p className="mt-2" style={{ color: "var(--muted)" }}>
                    {c.summary}
                  </p>
                  <p
                    className="mono mt-3 text-sm"
                    style={{ color: "var(--accent)" }}
                  >
                    {c.stack.join(" · ")}
                  </p>
                  {/* Its own line: appended to the stack list it read as one
                      more technology rather than as the headline number. */}
                  {lead ? (
                    <p
                      className="mono mt-2 text-sm"
                      style={{ color: "var(--muted)" }}
                    >
                      <span
                        className="font-semibold"
                        style={{ color: "var(--text)" }}
                      >
                        {lead.value}
                      </span>{" "}
                      {lead.metric}
                    </p>
                  ) : null}
                </div>
                {diagram ? (
                  <div
                    aria-hidden
                    className="hidden overflow-hidden border-l md:block"
                    style={{
                      borderColor: "var(--border)",
                      background: "var(--bg)",
                    }}
                  >
                    <pre
                      className="mono p-4 text-[10px] leading-snug"
                      style={{
                        color: "var(--muted)",
                        // Fades the crop out instead of guillotining a word,
                        // so it reads as a peek at the diagram, not a bug.
                        maskImage:
                          "linear-gradient(to right, #000 60%, transparent), linear-gradient(to bottom, #000 60%, transparent)",
                        maskComposite: "intersect",
                        WebkitMaskImage:
                          "linear-gradient(to right, #000 60%, transparent), linear-gradient(to bottom, #000 60%, transparent)",
                        WebkitMaskComposite: "source-in",
                      }}
                    >
                      {diagram}
                    </pre>
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
