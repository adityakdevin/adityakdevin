import { profile } from "@/content/data/profile";

/**
 * The three per-stack AI service pages, as data.
 *
 * They were three near-identical page files (~150 lines each) whose only real
 * differences were the strings below. Every copy edit had to be made three times
 * and one of them always got missed - which is exactly how the false "case
 * studies with named clients and real numbers" line survived on all three.
 *
 * URLs are unchanged: app/services/[slug]/page.tsx generates the same three
 * static routes, so no redirects.
 */

export type Service = {
  slug: string;
  /** ServiceStackNav's active key. */
  navKey: "laravel" | "node" | "python";
  title: string;
  metaDescription: string;
  /** Terminal eyebrow: `cat services/<file>` */
  file: string;
  h1: string;
  /** Fills "...and I build AI features into ___ with my own hands." */
  leadObject: string;
  /** Fills "9+ years of ___" - the Laravel page qualifies it, the others do not. */
  leadExperience: string;
  jsonLdName: string;
  jsonLdDescription: string;
  /** withRef token on the booking CTA. */
  ref: string;
  /** Fills "the highest ROI for your ___" in the offer box. */
  offerObject: string;
  capabilities: { h: string; body: string }[];
  /** The one line that differs in step 02. */
  auditCodebase: string;
  /** Dev.to link text in the proof section. */
  devtoSeries: string;
  /** Stack-specific proof. Every entry must resolve to a real route. */
  proof: { title: string; href: string; note: string }[];
  /** Who this is for, and who it is not. Disqualification is the cheapest trust signal there is. */
  goodFit: string[];
  notFit: string[];
};

// Own-work proof that exists today and applies to every stack.
const ASSISTANT_PROOF = {
  title: "AskAditya - a public LLM endpoint that cannot run up a bill",
  href: "/work/askaditya-terminal-assistant",
  note: "The widget in the corner of this page. Four gates before the model, a $10 hard cap, and every number citing the file it lives in.",
};

// Identical on all three pages. Defined once; step 02's per-stack line is the
// only part that varies, so it interpolates.
export const PROCESS = (auditCodebase: string) => [
  {
    step: "01",
    h: "30-minute call",
    body: "You describe the workflow that hurts. I tell you honestly whether AI helps - sometimes the answer is a queue and a cron job, and I'll say so.",
  },
  {
    step: "02",
    h: "Fixed-scope audit",
    body: `One week. I review your ${auditCodebase}, identify the 2-3 highest-ROI AI integrations, and deliver a build-ready spec with cost and latency estimates. Fixed quote up front.`,
  },
  {
    step: "03",
    h: "Build",
    body: "I implement the spec - tested, rate-limited, spend-capped, deployed. You own the code; nothing is locked to me.",
  },
];

const PRODUCTION_CONCERNS = {
  h: "Production concerns handled, not demoed",
  body: "Rate limiting, spend caps, prompt caching, streaming, failure modes, and evals. The difference between an AI demo and an AI feature is everything that happens when the API is slow, wrong, or down.",
};

export const services: Service[] = [
  {
    slug: "laravel-ai-development",
    navKey: "laravel",
    // SERP-validated 2026-07-17: the head terms are owned by agency template
    // pages, so this targets person-intent commercial variants instead. The
    // homepage KEEPS "Laravel AI integration developer India" - no cannibalization.
    title: "Laravel AI Integration Expert - hire a freelance Laravel AI developer",
    metaDescription:
      "I integrate AI into Laravel applications - chatbots, RAG, document automation - as a named engineer with 9+ years of shipped systems, not an agency bench. Fixed-scope AI Integration Audit available.",
    file: "laravel-ai.md",
    h1: "Laravel AI integration, by a named engineer",
    leadObject: "existing Laravel apps",
    leadExperience: "shipped Laravel systems",
    jsonLdName: "Laravel AI integration development",
    jsonLdDescription:
      "AI integration for Laravel applications: chatbots, retrieval-augmented generation, document processing, and workflow automation. Fixed-scope audit or full implementation.",
    ref: "services-laravel-ai",
    offerObject: "Laravel app",
    auditCodebase: "Laravel codebase",
    devtoSeries: "Laravel + AI series on Dev.to",
    proof: [
      ASSISTANT_PROOF,
      {
        title: "Queue-based AI workflows in Laravel",
        href: "/blog/queue-based-ai-workflows-in-laravel-jobs-retries-and-cost-control",
        note: "Jobs, retries that do not re-bill you, per-run token budgets, and a spend cap that stops instead of alerting.",
      },
      {
        title: "RAG in Laravel with pgvector",
        href: "/blog/rag-in-laravel-embeddings-and-pgvector-for-a-knowledge-base-bot",
        note: "The whole retrieval pipeline, including an honest section on when you do not need RAG at all.",
      },
    ],
    goodFit: [
      "You run a Laravel app in production and want AI inside it, not beside it.",
      "You have a workflow that eats staff hours: support triage, document intake, report writing.",
      "You want one engineer who owns the feature from migration to deployed UI.",
    ],
    notFit: [
      "You want a chatbot because competitors have one. I will say so on the call.",
      "You are pre-product and want someone to decide what to build. Hire a product person first.",
      "You need a team of five by Monday. I am one person with a calendar.",
    ],
    capabilities: [
      {
        h: "AI features inside your existing Laravel app",
        body: "Chat assistants, retrieval-augmented generation over your own data, document extraction, and smart automation - built into the codebase you already run, using the official Laravel AI SDK or direct provider APIs. No rewrite, no parallel system.",
      },
      PRODUCTION_CONCERNS,
      {
        h: "Full-stack delivery",
        body: `${profile.yearsExperience} years shipping Laravel, Livewire/Inertia, and Vue/React systems for real businesses. One person from data model to deployed feature - no handoffs.`,
      },
    ],
  },
  {
    slug: "nodejs-ai-development",
    navKey: "node",
    title: "Node.js AI Integration Expert - hire a freelance AI engineer for Node/Next.js",
    metaDescription:
      "I build AI features into Node.js and Next.js apps - chatbots, RAG, streaming, tool-calling agents - as a named engineer with 9+ years of shipped systems, not an agency bench. Fixed-scope AI Integration Audit available.",
    file: "nodejs-ai.md",
    h1: "Node.js AI integration, by a named engineer",
    leadObject: "existing Node.js and Next.js apps",
    leadExperience: "shipped systems",
    jsonLdName: "Node.js AI integration development",
    jsonLdDescription:
      "AI integration for Node.js and Next.js applications: chatbots, retrieval-augmented generation, streaming responses, and tool-calling agents with the Vercel AI SDK. Fixed-scope audit or full implementation.",
    ref: "services-nodejs-ai",
    offerObject: "Node app",
    auditCodebase: "Node/Next.js codebase",
    devtoSeries: "AI engineering series on Dev.to",
    proof: [
      {
        ...ASSISTANT_PROOF,
        note: "Built in exactly this stack: Next.js App Router, the Vercel AI SDK, streaming, four gates before the model. Open it and try to break it, then read what is behind it.",
      },
      {
        title: "The lens that stops me lying about my own work",
        href: "/work/shipping-a-claims-lens",
        note: "A Node CLI wired into a commit hook and CI. The kind of unglamorous tooling that decides whether a codebase stays honest.",
      },
    ],
    goodFit: [
      "You have a Next.js or Node app and want streaming AI features in it without a rewrite.",
      "You need the endpoint hardened: rate limits, spend caps, and sane behaviour when the provider is down.",
      "You want the AI SDK used properly rather than copied from a quickstart.",
    ],
    notFit: [
      "You want a greenfield AI product designed from scratch. This is integration work.",
      "You need a realtime multiplayer system where AI is incidental.",
      "Your bottleneck is model quality, not engineering. That is a research problem.",
    ],
    capabilities: [
      {
        h: "AI features inside your Node/Next.js app",
        body: "Chat assistants, retrieval-augmented generation over your own data, streaming responses, and tool-calling agents - built into your existing Next.js or Node backend with the Vercel AI SDK or direct provider APIs. Works with your App Router, edge or Node runtime, and existing auth. No rewrite.",
      },
      PRODUCTION_CONCERNS,
      {
        h: "Full-stack delivery",
        body: `${profile.yearsExperience} years shipping TypeScript/Node, Next.js, and React systems for real businesses. One person from data model to deployed feature - no handoffs.`,
      },
    ],
  },
  {
    slug: "python-ai-development",
    navKey: "python",
    title: "Python AI Integration Expert - hire a freelance AI engineer for FastAPI/Django",
    metaDescription:
      "I build AI features into Python backends - FastAPI, Django - chatbots, RAG, document pipelines, and agents, as a named engineer with 9+ years of shipped systems, not an agency bench. Fixed-scope AI Integration Audit available.",
    file: "python-ai.md",
    h1: "Python AI integration, by a named engineer",
    leadObject: "existing Python backends",
    leadExperience: "shipped systems",
    jsonLdName: "Python AI integration development",
    jsonLdDescription:
      "AI integration for Python backends (FastAPI, Django): chatbots, retrieval-augmented generation, document processing pipelines, and agents with LangChain or direct provider APIs. Fixed-scope audit or full implementation.",
    ref: "services-python-ai",
    offerObject: "Python app",
    auditCodebase: "Python codebase",
    devtoSeries: "AI engineering series on Dev.to",
    proof: [ASSISTANT_PROOF],
    goodFit: [
      "You run a PHP or Node product and need a Python AI service alongside it, with a clean boundary between them.",
      "You have document pipelines, embeddings, or batch scoring that belong in Python and nowhere else.",
      "You want the integration and cost model designed by someone who has shipped the rest of your stack.",
    ],
    notFit: [
      "Your whole product is Python and you want a lead Python engineer. I will tell you honestly on the call - that is not the shape of work I take.",
      "You need model training or research. I integrate models; I do not train them.",
      "You want a data science hire. This is engineering.",
    ],
    capabilities: [
      {
        h: "AI features inside your Python backend",
        body: "Chat assistants, retrieval-augmented generation over your own data, document-extraction pipelines, and agents - built into your existing FastAPI or Django app with LangChain or direct provider SDKs. Fits your existing models, tasks (Celery), and data layer. No parallel system.",
      },
      PRODUCTION_CONCERNS,
      {
        h: "Full-stack delivery",
        body: `${profile.yearsExperience} years shipping backend systems for real businesses, from data model to deployed feature. Python where the data and ML-adjacent work lives - one person, no handoffs.`,
      },
    ],
  },
];

export const getService = (slug: string) => services.find((s) => s.slug === slug);
