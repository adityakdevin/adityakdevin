import { profile } from "@/content/data/profile";
import { faq } from "@/content/data/faq";

import { SITE_URL } from "@/lib/site";

const BASE = SITE_URL;
const PERSON_ID = `${BASE}/#aditya`;

/** Shared @id graph (SPEC S7) so engines connect entities across pages. */
export function personJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": PERSON_ID,
    name: profile.name,
    alternateName: profile.handle,
    url: BASE,
    email: `mailto:${profile.email}`,
    jobTitle: `${profile.role} · Full Stack Developer & AI Engineer`,
    worksFor: { "@type": "Organization", name: profile.company },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Lucknow",
      addressRegion: "Uttar Pradesh",
      addressCountry: "IN",
    },
    sameAs: [profile.github, profile.linkedin, profile.twitter, profile.devto],
    knowsAbout: Object.values(profile.skills).flat(),
  };
}

export function profilePageJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": `${BASE}/#profilepage`,
    url: BASE,
    name: `${profile.name} - Full Stack Developer, AI Engineer & Solution Architect`,
    mainEntity: { "@id": PERSON_ID },
  };
}

export function faqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${BASE}/#faq`,
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export function cvJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": `${BASE}/cv#page`,
    url: `${BASE}/cv`,
    name: `CV - ${profile.name}`,
    mainEntity: {
      "@id": PERSON_ID,
      "@type": "Person",
      name: profile.name,
      hasOccupation: {
        "@type": "Occupation",
        name: "Full Stack Developer & AI Engineer",
        occupationLocation: { "@type": "City", name: "Lucknow" },
        skills: Object.values(profile.skills).flat().join(", "),
      },
    },
  };
}

/** Blog post → Article node in the shared graph (design doc 20260717). */
export function articleJsonLd(post: {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  canonical?: string;
}) {
  const url = post.canonical ?? `${BASE}/blog/${post.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${BASE}/blog/${post.slug}#article`,
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    keywords: post.tags.join(", "),
    url,
    mainEntityOfPage: url,
    author: { "@id": PERSON_ID },
    publisher: { "@id": PERSON_ID },
  };
}

/** Render helper - script tag payload. `<` is escaped so a title containing
 *  `</script>` can never break out of the tag (standard JSON-LD hardening). */
export function jsonLdScript(data: object) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
