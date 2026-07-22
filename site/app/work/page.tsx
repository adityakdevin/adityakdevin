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

export default function WorkIndexPage() {
  if (publishedCaseStudies.length < MIN_STUDIES) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${SITE_URL}/work#worklist`,
    itemListElement: publishedCaseStudies.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/work/${c.slug}`,
      name: c.title,
    })),
  };

  return (
    <main className="mx-auto max-w-3xl flex-1 px-6 py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      <p className="mono mb-3 text-sm" style={{ color: "var(--muted)" }}>
        <span style={{ color: "var(--accent)" }}>aditya@dev</span>:~$ ls work/
      </p>
      <h1 className="mono h2-rule text-4xl font-semibold">Work</h1>

      <ul className="mt-10">
        {publishedCaseStudies.map((c) => {
          const lead = c.outcome?.[0];
          return (
            <li
              key={c.slug}
              className="border-b py-8 first:border-t"
              style={{ borderColor: "var(--border)" }}
            >
              <h2 className="text-xl font-medium">
                <Link href={`/work/${c.slug}`}>{c.title}</Link>
              </h2>
              {c.client || c.period ? (
                <p className="mono mt-1 text-sm" style={{ color: "var(--muted)" }}>
                  {[c.client, c.period].filter(Boolean).join(" · ")}
                </p>
              ) : null}
              <p className="mt-2" style={{ color: "var(--muted)" }}>
                {c.summary}
              </p>
              <p className="mono mt-3 text-sm" style={{ color: "var(--accent)" }}>
                {c.stack.join(" · ")}
                {lead ? `  -  ${lead.value} ${lead.metric}` : ""}
              </p>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
