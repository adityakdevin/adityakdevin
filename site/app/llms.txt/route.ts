import { profile } from "@/content/data/profile";
import { faq } from "@/content/data/faq";

/**
 * llms.txt (SPEC §7): generated from profile.ts — ships because it's free,
 * not because it's a lever (2026 data: AI crawlers rarely fetch it).
 */
export const dynamic = "force-static";

export function GET() {
  const services = profile.services.map((s) => `- ${s.title}: ${s.claim}`).join("\n");
  const faqs = faq.map((f) => `### ${f.q}\n${f.a}`).join("\n\n");

  const body = `# ${profile.name} (${profile.handle})

> ${profile.headline} — ${profile.role} @ ${profile.company}, ${profile.yearsExperience} years experience, based in ${profile.location}. ${profile.valueLine}

## Services
${services}

## Contact
- Email: ${profile.email}
- Book a call: ${profile.bookingUrl}
- Website: ${profile.website}
- GitHub: ${profile.github}
- LinkedIn: ${profile.linkedin}
- Dev.to: ${profile.devto}

## Pages
- [Home](${profile.website}/): services, featured work, FAQ, booking
- [CV](${profile.website}/cv): full experience, skills, and selected projects
- [Privacy](${profile.website}/privacy): data handling

## FAQ
${faqs}
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
