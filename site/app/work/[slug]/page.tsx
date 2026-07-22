import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { publishedCaseStudies } from "@/content/data/work";
import { jsonLdScript } from "@/lib/jsonld";
import { SITE_URL } from "@/lib/site";

// Publication gate: only published studies get a static route. A draft study in
// work.ts is unreachable here (404), not just hidden from the index. See ceo-plan D4b.
export function generateStaticParams() {
  return publishedCaseStudies.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const study = publishedCaseStudies.find((c) => c.slug === slug);
  if (!study) return {};
  return {
    title: study.title,
    description: study.summary,
    alternates: { canonical: `/work/${study.slug}` },
  };
}

export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const study = publishedCaseStudies.find((c) => c.slug === slug);
  if (!study) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "@id": `${SITE_URL}/work/${study.slug}#work`,
    name: study.title,
    description: study.summary,
    author: { "@id": `${SITE_URL}/#aditya` },
    keywords: study.stack.join(", "),
    url: `${SITE_URL}/work/${study.slug}`,
  };

  return (
    <main className="mx-auto max-w-3xl flex-1 px-6 py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      <p className="mono mb-3 text-sm" style={{ color: "var(--muted)" }}>
        <span style={{ color: "var(--accent)" }}>$</span> cat work/{study.slug}.md
      </p>
      <h1 className="mono h2-rule text-4xl font-semibold leading-tight">{study.title}</h1>
      {study.client || study.role || study.period ? (
        <p className="mono mt-3 text-sm" style={{ color: "var(--muted)" }}>
          {[study.client, study.role, study.period].filter(Boolean).join(" · ")}
        </p>
      ) : null}
      <p className="mt-4 text-lg" style={{ color: "var(--muted)" }}>
        {study.summary}
      </p>
      <p className="mono mt-4 text-sm" style={{ color: "var(--accent)" }}>
        {study.stack.join(" · ")}
      </p>

      {study.outcome && study.outcome.length > 0 ? (
        <div className="mt-8">
          <p className="mono mb-3 text-sm" style={{ color: "var(--muted)" }}>
            <span style={{ color: "var(--accent)" }}>$</span> metrics
          </p>
          <div className="flex flex-wrap gap-x-10 gap-y-4">
            {study.outcome.map((o) => (
              <div key={o.metric}>
                <div className="mono text-2xl font-semibold" style={{ color: "var(--accent)" }}>
                  {o.value}
                </div>
                <div className="text-sm" style={{ color: "var(--muted)" }}>
                  {o.metric}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {study.sections.map((s) => (
        <section key={s.h} className="mt-10">
          <h2 className="mono text-2xl font-semibold">{s.h}</h2>
          <p className="mt-3">{s.body}</p>
        </section>
      ))}

      <div className="mt-12 flex flex-wrap gap-4">
        {study.repo ? (
          <a
            href={study.repo}
            className="btn mono min-h-11 rounded border px-5 py-2.5 text-sm font-medium no-underline"
            style={{ borderColor: "var(--border)" }}
          >
            View the code →
          </a>
        ) : null}
        {study.liveUrl ? (
          <a
            href={study.liveUrl}
            className="btn mono min-h-11 rounded border px-5 py-2.5 text-sm font-medium no-underline"
            style={{ borderColor: "var(--border)" }}
          >
            View it live →
          </a>
        ) : null}
        <Link
          href="/#contact"
          className="btn mono min-h-11 rounded px-5 py-2.5 text-sm font-semibold no-underline"
          style={{ background: "var(--accent)", color: "var(--on-accent)" }}
        >
          Build something like this →
        </Link>
      </div>
    </main>
  );
}
