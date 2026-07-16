import { profile } from "@/content/data/profile";
import { faq } from "@/content/data/faq";

const BASE = "https://adityadev.in";
const PERSON_ID = `${BASE}/#aditya`;

/** Shared @id graph (SPEC §7) so engines connect entities across pages. */
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
    name: `${profile.name} — Full Stack Developer, AI Engineer & Solution Architect`,
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
    name: `CV — ${profile.name}`,
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

/** Render helper — script tag payload. */
export function jsonLdScript(data: object) {
  return JSON.stringify(data);
}
