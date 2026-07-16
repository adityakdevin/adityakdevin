/**
 * Single source (SPEC §3): rendered FAQ section + FAQPage JSON-LD + bot system prompt (P3).
 * Substantive answers only — thin/promotional FAQ schema backfires (§5.7).
 */
export const faq = [
  {
    q: "Do you work with international clients?",
    a: "Yes — most of my client work has been for companies in North America and Europe, delivered remotely from India. I overlap comfortably with US-morning and full EU hours, and everything runs through clear written specs, staging environments, and weekly demos.",
  },
  {
    q: "What does an AI chatbot or LLM integration cost?",
    a: "A production chatbot on your existing Laravel or Node app — with streaming responses, rate limiting, and cost caps — typically lands in the $2,000–$8,000 range depending on knowledge-base complexity. Ongoing API costs are usually under $50/month for small businesses. I'll give you a fixed quote after a 30-minute scoping call.",
  },
  {
    q: "What's your availability?",
    a: "I'm a full-time Tech Lead, and I take one or two side engagements at a time — AI integrations, Laravel builds, and architecture consulting. Book a call and I'll tell you honestly whether your timeline fits.",
  },
  {
    q: "What stack do you work in?",
    a: "Backend: PHP/Laravel first, plus Python and Node.js. Frontend: Vue/Nuxt and React/Next.js with TypeScript. AI: OpenAI and Claude APIs, streaming interfaces, RAG pipelines. Infrastructure: MySQL/PostgreSQL, Redis, Docker, AWS.",
  },
  {
    q: "Can you take over an existing codebase?",
    a: "Yes — a lot of my work is rescuing or extending systems other teams started. I begin with a paid audit (architecture, security, and a prioritized fix list) so you know exactly what you're sitting on before committing to bigger work.",
  },
  {
    q: "How do we start?",
    a: "Book a free 30-minute intro call. Come with the problem, not a spec — part of what I do is turn a business problem into a technical plan. If we're a fit you'll get a written proposal with fixed scope and timeline within a few days.",
  },
] as const;
