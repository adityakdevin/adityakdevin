import type { Metadata } from "next";
import Link from "next/link";
import { profile } from "@/content/data/profile";
import { jsonLdScript } from "@/lib/jsonld";
import { NewsletterForm } from "@/components/NewsletterForm";
import { ServiceStackNav } from "@/components/ServiceStackNav";
import { SITE_URL, withRef } from "@/lib/site";

/**
 * The audit is the only productized offer on the site and it was named on three
 * stack pages without a page of its own - high-intent readers landed on
 * /#contact instead. Deliberately stack-neutral so it takes the head term
 * without cannibalizing the three per-stack pages.
 *
 * NOTE: no `offers` price in the JSON-LD. The $2,000-$8,000 band is the
 * INTEGRATION range, not the audit, and the audit price is quoted on the call
 * on purpose.
 */
export const metadata: Metadata = {
  title: {
    absolute: "AI Integration Audit - one week, fixed price, build-ready spec",
  },
  description:
    "A one-week fixed-price review of your codebase: the 2-3 highest-ROI AI integrations, with cost, latency, and risk spelled out. If AI doesn't help, you get that in writing.",
  alternates: { canonical: "/services/ai-integration-audit" },
};

const DELIVERABLES = [
  {
    h: "The shortlist",
    body: "Two or three AI integrations ranked by return, not by novelty. Each one names the workflow it replaces and the hours it gives back.",
  },
  {
    h: "Cost and latency, per integration",
    body: "What each one costs to run at your volume, priced off real provider rates, and how slow the user-facing path gets. Estimates you can put in a budget rather than a range with a shrug.",
  },
  {
    h: "The risk section",
    body: "Where it fails, what it does when the provider is down, what it will confidently get wrong, and what that costs you. This is the section most proposals leave out.",
  },
  {
    h: "A build-ready spec",
    body: "Enough detail that any competent engineer can implement it - your team, another contractor, or me. Nothing about it is locked to me.",
  },
];

const WEEK = [
  {
    step: "Day 1",
    h: "Access and context",
    body: "Read-only access to the codebase, plus one call with whoever knows the workflow best.",
  },
  {
    step: "Days 2-3",
    h: "The read",
    body: "Architecture, data model, where the work actually happens, and where a model could sit without a rewrite.",
  },
  {
    step: "Day 4",
    h: "Costing",
    body: "Volume, token estimates, provider pricing, and the latency budget for anything a user waits on.",
  },
  {
    step: "Day 5",
    h: "The spec",
    body: "Written up and walked through on a call. You keep the document either way.",
  },
];

export default function AuditPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${SITE_URL}/services/ai-integration-audit#service`,
    name: "AI Integration Audit",
    serviceType: "Software consulting",
    description:
      "A one-week fixed-price audit of an existing codebase identifying the highest-return AI integrations, with cost, latency, and risk estimates and a build-ready specification.",
    provider: { "@id": `${SITE_URL}/#aditya` },
    areaServed: "Worldwide",
    url: `${SITE_URL}/services/ai-integration-audit`,
  };

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }}
      />
      <p className="mono mb-3 text-sm" style={{ color: "var(--muted)" }}>
        <span style={{ color: "var(--accent)" }}>$</span> cat
        services/ai-integration-audit.md
      </p>
      <h1 className="mono h2-rule text-4xl font-semibold leading-tight">
        AI Integration Audit: one week, fixed price
      </h1>
      <p className="mt-4 text-lg" style={{ color: "var(--muted)" }}>
        Most AI projects fail before a line of code, by picking the wrong thing
        to build. This is the week that stops that happening - and the cheapest
        possible way to find out I am the wrong person to hire.
      </p>

      <section className="mt-12">
        <h2 className="mono h-section h2-rule">What you get</h2>
        <div className="mt-6 space-y-6">
          {DELIVERABLES.map((d) => (
            <div key={d.h}>
              <h3 className="mono font-semibold">{d.h}</h3>
              <p className="mt-1" style={{ color: "var(--muted)" }}>
                {d.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="mono h-section h2-rule">The week</h2>
        <ol className="mt-6 space-y-6">
          {WEEK.map((w) => (
            <li key={w.step} className="flex gap-4">
              <span
                className="mono w-20 shrink-0 text-sm font-semibold"
                style={{ color: "var(--accent)" }}
              >
                {w.step}
              </span>
              <div>
                <h3 className="mono font-semibold">{w.h}</h3>
                <p className="mt-1" style={{ color: "var(--muted)" }}>
                  {w.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12">
        <h2 className="mono h-section h2-rule">The honest part</h2>
        <p className="mt-6">
          Sometimes the answer is a queue and a cron job, not a model. If that
          is what the week finds, you get it in writing, and the audit has just
          saved you the build. I would rather write that document than take the
          project.
        </p>
        <p className="mt-3">
          For scale: most integrations that do go ahead land in the
          $2,000-$8,000 range. The audit is quoted separately on the call, fixed
          before it starts.
        </p>
      </section>

      <section
        className="mt-12 rounded border p-6"
        style={{ borderColor: "var(--accent)", background: "var(--surface)" }}
      >
        <h2 className="mono text-xl font-semibold">
          <span style={{ color: "var(--accent)" }}>Start here:</span> a
          30-minute call
        </h2>
        <p className="mt-2">
          Describe the workflow that hurts. I tell you whether the audit is
          worth your money before you spend any of it.
        </p>
        <div className="mt-5 flex flex-wrap gap-4">
          <a
            href={withRef(profile.bookingUrl, "services-audit")}
            className="btn mono min-h-11 rounded px-5 py-2.5 text-sm font-semibold no-underline"
            style={{ background: "var(--accent)", color: "var(--on-accent)" }}
          >
            Book the 30-minute call&nbsp;→
          </a>
          <Link
            href="/#contact"
            className="btn mono min-h-11 rounded border px-5 py-2.5 text-sm font-medium no-underline"
            style={{ borderColor: "var(--border)" }}
          >
            Or write to me&nbsp;→
          </Link>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="mono h-section h2-rule">Working in a specific stack?</h2>
        <p className="mt-6">
          The audit is the same week either way; these go into more detail.
        </p>
        <div className="mt-4">
          <ServiceStackNav className="mb-0" />
        </div>
      </section>

      <div className="mt-12">
        <NewsletterForm />
      </div>
    </main>
  );
}
