import type { Metadata } from "next";
import Link from "next/link";
import { profile } from "@/content/data/profile";
import { jsonLdScript } from "@/lib/jsonld";
import { NewsletterForm } from "@/components/NewsletterForm";
import { ServiceStackNav } from "@/components/ServiceStackNav";
import { SITE_URL, withRef } from "@/lib/site";

/**
 * Python AI service-intent page (positioning broadened 2026-07-18 -
 * SERVICE_PAGES_SPEC.md). Targets person-intent commercial variants
 * ("Python AI developer", "FastAPI/Django AI integration") - the Laravel/Node
 * pages and homepage own their own clusters, so no cannibalization.
 */
export const metadata: Metadata = {
  title: "Python AI Integration Expert - hire a freelance AI engineer for FastAPI/Django",
  description:
    "I build AI features into Python backends - FastAPI, Django - chatbots, RAG, document pipelines, and agents, as a named engineer with 9+ years of shipped systems, not an agency bench. Fixed-scope AI Integration Audit available.",
  alternates: { canonical: "/services/python-ai-development" },
};

const BASE = SITE_URL;

const serviceJsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  "@id": `${BASE}/services/python-ai-development#service`,
  name: "Python AI integration development",
  serviceType: "Software development",
  description:
    "AI integration for Python backends (FastAPI, Django): chatbots, retrieval-augmented generation, document processing pipelines, and agents with LangChain or direct provider APIs. Fixed-scope audit or full implementation.",
  provider: { "@id": `${BASE}/#aditya` },
  areaServed: "Worldwide",
  url: `${BASE}/services/python-ai-development`,
};

const CAPABILITIES = [
  {
    h: "AI features inside your Python backend",
    body: "Chat assistants, retrieval-augmented generation over your own data, document-extraction pipelines, and agents - built into your existing FastAPI or Django app with LangChain or direct provider SDKs. Fits your existing models, tasks (Celery), and data layer. No parallel system.",
  },
  {
    h: "Production concerns handled, not demoed",
    body: "Rate limiting, spend caps, prompt caching, streaming, failure modes, and evals. The difference between an AI demo and an AI feature is everything that happens when the API is slow, wrong, or down.",
  },
  {
    h: "Full-stack delivery",
    body: `${profile.yearsExperience} years shipping backend systems for real businesses, from data model to deployed feature. Python where the data and ML-adjacent work lives - one person, no handoffs.`,
  },
];

const PROCESS = [
  { step: "01", h: "30-minute call", body: "You describe the workflow that hurts. I tell you honestly whether AI helps - sometimes the answer is a queue and a cron job, and I'll say so." },
  { step: "02", h: "Fixed-scope audit", body: "One week. I review your Python codebase, identify the 2-3 highest-ROI AI integrations, and deliver a build-ready spec with cost and latency estimates. Fixed quote up front." },
  { step: "03", h: "Build", body: "I implement the spec - tested, rate-limited, spend-capped, deployed. You own the code; nothing is locked to me." },
];

export default function PythonAiServicePage() {
  return (
    <main className="mx-auto max-w-3xl flex-1 px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(serviceJsonLd) }}
      />
      <p className="mono mb-3 text-sm" style={{ color: "var(--muted)" }}>
        <span style={{ color: "var(--accent)" }}>$</span> cat services/python-ai.md
      </p>
      <h1 className="mono h2-rule text-4xl font-semibold leading-tight">
        Python AI integration, by a named engineer
      </h1>
      <p className="mt-4 text-lg" style={{ color: "var(--muted)" }}>
        Agencies sell you a bench. I&apos;m {profile.name} - {profile.role} @ {profile.company},{" "}
        {profile.yearsExperience} years of shipped systems - and I build AI features into
        existing Python backends with my own hands. The terminal assistant on{" "}
        <Link href="/">this site&apos;s homepage</Link> runs on the same patterns I ship to
        clients.
      </p>

      <div className="mt-8">
        <ServiceStackNav current="python" />
      </div>

      {CAPABILITIES.map((c) => (
        <section key={c.h} className="mt-10">
          <h2 className="mono h2-rule text-2xl font-semibold">{c.h}</h2>
          <p className="mt-6">{c.body}</p>
        </section>
      ))}

      <section className="mt-12">
        <h2 className="mono h2-rule text-2xl font-semibold">How an engagement works</h2>
        <ol className="mt-6 space-y-6">
          {PROCESS.map((p) => (
            <li key={p.step} className="flex gap-4">
              <span className="mono text-sm font-semibold" style={{ color: "var(--accent)" }}>
                {p.step}
              </span>
              <div>
                <h3 className="mono font-semibold">{p.h}</h3>
                <p className="mt-1" style={{ color: "var(--muted)" }}>
                  {p.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12 rounded border p-6" style={{ borderColor: "var(--accent)", background: "var(--surface)" }}>
        <h2 className="mono text-xl font-semibold">
          <span style={{ color: "var(--accent)" }}>The offer:</span> AI Integration Audit
        </h2>
        <p className="mt-2">
          One week, fixed price, quoted on the call. You get a build-ready spec naming the 2-3
          AI integrations with the highest ROI for your Python app - with cost, latency, and
          risk spelled out. If the honest answer is &ldquo;AI doesn&apos;t help here,&rdquo;
          you&apos;ll get that in writing instead, and it costs you the call.
        </p>
        <div className="mt-5 flex flex-wrap gap-4">
          <a
            href={withRef(profile.bookingUrl, "services-python-ai")}
            className="btn mono min-h-11 rounded px-5 py-2.5 text-sm font-semibold no-underline"
            style={{ background: "var(--accent)", color: "var(--on-accent)" }}
          >
            Book the 30-minute call →
          </a>
          <Link
            href="/#contact"
            className="btn mono min-h-11 rounded border px-5 py-2.5 text-sm font-medium no-underline"
            style={{ borderColor: "var(--border)" }}
          >
            Or write to me →
          </Link>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="mono h2-rule text-2xl font-semibold">Proof, not promises</h2>
        <p className="mt-6">
          Read the <Link href="/blog">field notes</Link> - end-to-end build walkthroughs of real
          projects - or the <a href={profile.devto}>AI engineering series on Dev.to</a>. Case
          studies with named clients and real numbers live on{" "}
          <Link href="/work/budgetgen">the work page</Link>.
        </p>
      </section>

      <div className="mt-12">
        <NewsletterForm />
      </div>
    </main>
  );
}
