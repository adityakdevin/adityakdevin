import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { caseStudies } from "@/content/data/work";
import { jsonLdScript } from "@/lib/jsonld";

export function generateStaticParams() {
  return caseStudies.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const study = caseStudies.find((c) => c.slug === slug);
  if (!study) return {};
  return {
    title: study.title,
    description: study.summary,
    alternates: { canonical: `/work/${study.slug}` },
  };
}

export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const study = caseStudies.find((c) => c.slug === slug);
  if (!study) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "@id": `https://adityadev.in/work/${study.slug}#work`,
    name: study.title,
    description: study.summary,
    author: { "@id": "https://adityadev.in/#aditya" },
    keywords: study.stack.join(", "),
    url: `https://adityadev.in/work/${study.slug}`,
  };

  return (
    <main className="mx-auto max-w-3xl flex-1 px-6 py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      <p className="mono mb-3 text-sm" style={{ color: "var(--muted)" }}>
        <span style={{ color: "var(--accent)" }}>$</span> cat work/{study.slug}.md
      </p>
      <h1 className="mono text-4xl font-semibold leading-tight">{study.title}</h1>
      <p className="mt-4 text-lg" style={{ color: "var(--muted)" }}>
        {study.summary}
      </p>
      <p className="mono mt-4 text-sm" style={{ color: "var(--accent)" }}>
        {study.stack.join(" · ")}
      </p>

      {study.sections.map((s) => (
        <section key={s.h} className="mt-10">
          <h2 className="mono text-2xl font-semibold">{s.h}</h2>
          <p className="mt-3">{s.body}</p>
        </section>
      ))}

      <div className="mt-12 flex flex-wrap gap-4">
        <a
          href={study.repo}
          className="btn mono min-h-11 rounded border px-5 py-2.5 text-sm font-medium no-underline"
          style={{ borderColor: "var(--border)" }}
        >
          View the code →
        </a>
        <Link
          href="/#contact"
          className="btn mono min-h-11 rounded px-5 py-2.5 text-sm font-semibold no-underline"
          style={{ background: "var(--accent)", color: "#06222a" }}
        >
          Build something like this →
        </Link>
      </div>
    </main>
  );
}
