import { profile } from "@/content/data/profile";
import { faq } from "@/content/data/faq";

/**
 * llms.txt (SPEC S7): generated from profile.ts - ships because it's free,
 * not because it's a lever (2026 data: AI crawlers rarely fetch it).
 */
export const dynamic = "force-static";

export function GET() {
  const services = profile.services.map((s) => `- ${s.title}: ${s.claim}`).join("\n");
  const faqs = faq.map((f) => `### ${f.q}\n${f.a}`).join("\n\n");

  const body = `# ${profile.name} (${profile.handle})

> ${profile.headline} - ${profile.role} @ ${profile.company}, ${profile.yearsExperience} years experience, based in ${profile.location}. ${profile.valueLine}

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
- [Hire me](${profile.website}/hire): availability, engagement models, and the contact form
- [AI Integration Audit](${profile.website}/services/ai-integration-audit): one week, fixed price, build-ready spec
- [Laravel + AI](${profile.website}/services/laravel-ai-development): AI/LLM features in Laravel apps
- [Node + AI](${profile.website}/services/nodejs-ai-development): AI/LLM features in Node and Next.js apps
- [Python + AI](${profile.website}/services/python-ai-development): Python AI services alongside a PHP or Node app
- [Blog](${profile.website}/blog): field notes on shipping Laravel + AI
- [CV](${profile.website}/cv): full experience, skills, and selected projects
- [Now](${profile.website}/now): what I am working on this month
- [Uses](${profile.website}/uses): tools, editor, and stack
- [Privacy](${profile.website}/privacy): data handling

## FAQ
${faqs}
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
