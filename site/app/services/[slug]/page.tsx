import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { profile } from "@/content/data/profile";
import { services, getService, PROCESS } from "@/content/data/services";
import { jsonLdScript } from "@/lib/jsonld";
import { NewsletterForm } from "@/components/NewsletterForm";
import { ServiceStackNav } from "@/components/ServiceStackNav";
import { SITE_URL, withRef } from "@/lib/site";

/**
 * Service-intent pages (design doc 20260717, eng review D16/T4), one route for
 * all three stacks. Same URLs as the three page files this replaced - the copy
 * lives in content/data/services.ts now, so a wording fix is one edit, not three.
 */
export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) return {};
  return {
    title: service.title,
    description: service.metaDescription,
    alternates: { canonical: `/services/${service.slug}` },
  };
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) notFound();

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${SITE_URL}/services/${service.slug}#service`,
    name: service.jsonLdName,
    serviceType: "Software development",
    description: service.jsonLdDescription,
    provider: { "@id": `${SITE_URL}/#aditya` },
    areaServed: "Worldwide",
    url: `${SITE_URL}/services/${service.slug}`,
  };

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(serviceJsonLd) }}
      />
      <p className="mono mb-3 text-sm" style={{ color: "var(--muted)" }}>
        <span style={{ color: "var(--accent)" }}>$</span> cat services/
        {service.file}
      </p>
      <h1 className="mono h2-rule text-4xl font-semibold leading-tight">
        {service.h1}
      </h1>
      <p className="mt-4 text-lg" style={{ color: "var(--muted)" }}>
        Agencies sell you a bench. I&apos;m {profile.name} - {profile.role} @{" "}
        {profile.company}, {profile.yearsExperience} years of{" "}
        {service.leadExperience} - and I build AI features into{" "}
        {service.leadObject} with my own hands. The terminal assistant on{" "}
        <Link href="/">this site&apos;s homepage</Link> runs on the same
        patterns I ship to clients.
      </p>

      <div className="mt-8">
        <ServiceStackNav current={service.navKey} />
      </div>

      {service.capabilities.map((c) => (
        <section key={c.h} className="mt-10">
          <h2 className="mono h-section h2-rule">{c.h}</h2>
          <p className="mt-6">{c.body}</p>
        </section>
      ))}

      <section className="mt-12">
        <h2 className="mono h-section h2-rule">Who this is for</h2>
        <div className="mt-6 grid gap-8 md:grid-cols-2">
          <div>
            <p
              className="mono text-sm font-semibold"
              style={{ color: "var(--accent)" }}
            >
              A good fit
            </p>
            <ul className="mt-3 space-y-2">
              {service.goodFit.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
          <div>
            {/* Saying who this is NOT for is the cheapest trust signal available
                and no page on the site had one. */}
            <p
              className="mono text-sm font-semibold"
              style={{ color: "var(--muted)" }}
            >
              Not a fit
            </p>
            <ul className="mt-3 space-y-2" style={{ color: "var(--muted)" }}>
              {service.notFit.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="mono h-section h2-rule">How an engagement works</h2>
        <ol className="mt-6 space-y-6">
          {PROCESS(service.auditCodebase).map((p) => (
            <li key={p.step} className="flex gap-4">
              <span
                className="mono text-sm font-semibold"
                style={{ color: "var(--accent)" }}
              >
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

      <section
        className="mt-12 rounded border p-6"
        style={{ borderColor: "var(--accent)", background: "var(--surface)" }}
      >
        <h2 className="mono text-xl font-semibold">
          <span style={{ color: "var(--accent)" }}>The offer:</span> AI
          Integration Audit
        </h2>
        <p className="mt-2">
          One week, fixed price, quoted on the call. You get a build-ready spec
          naming the 2-3 AI integrations with the highest ROI for your{" "}
          {service.offerObject}
          {" - with cost, latency, and risk spelled out."} If the honest answer
          is &ldquo;AI doesn&apos;t help here,&rdquo; you&apos;ll get that in
          writing instead, and it costs you the call.
        </p>
        <div className="mt-5 flex flex-wrap gap-4">
          <a
            href={withRef(profile.bookingUrl, service.ref)}
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
        <h2 className="mono h-section h2-rule">Proof, not promises</h2>
        {/* This paragraph used to promise "case studies with named clients and
            real numbers" and link a solo Laravel CRUD app with neither. It now
            describes what the destination actually delivers. Restore the
            named-client wording when client studies land (plan phase 2). */}
        <p className="mt-6">
          Read the <Link href="/blog">field notes</Link> - end-to-end build
          walkthroughs of real projects - or the{" "}
          <a href={profile.devto}>{service.devtoSeries}</a>.
        </p>
        <ul className="mt-4 space-y-3">
          {service.proof.map((p) => (
            <li key={p.href}>
              <Link href={p.href} className="mono font-medium">
                {p.title}&nbsp;→
              </Link>
              <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                {p.note}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-12">
        <NewsletterForm />
      </div>
    </main>
  );
}
