/**
 * Single source of truth (SPEC §3): structured facts only.
 * Consumed by: home, /cv, lib/jsonld.ts, llms.txt generation, bot prompt (P3).
 */
export const profile = {
  name: "Aditya Kumar",
  handle: "adityakdevin",
  headline: "Full Stack Developer · AI Engineer · Solution Architect",
  valueLine: "I build Laravel & AI products that ship.",
  role: "Tech Lead",
  company: "MM Novatech",
  yearsExperience: "7+",
  location: "Lucknow, Uttar Pradesh, India",
  email: "contact@adityadev.in",
  // TODO(§13.1): confirm correct number before rendering — two variants exist on the old site.
  phone: null as string | null,
  website: "https://adityadev.in",
  // TODO(§13.3): replace with the real cal.com event URL once the account exists.
  bookingUrl: "https://cal.com/adityakdevin/intro",
  github: "https://github.com/adityakdevin",
  linkedin: "https://www.linkedin.com/in/adityakdevin",
  twitter: "https://twitter.com/adityakdevin",
  devto: "https://dev.to/adityakdevin",
  devtoUsername: "adityakdevin",

  metrics: [
    { value: "7+", label: "years shipping" },
    { value: "60+", label: "projects delivered" },
    { value: "8.3k+", label: "GitHub contributions" },
    { value: "1", label: "Laravel + AI series" },
  ],

  services: [
    {
      n: "01",
      title: "AI Integration",
      claim: "Chatbots, automations, and AI workflows that survive real users",
      lines: [
        "LLM chatbots, streaming interfaces, and automation wired into real products — not demos.",
        "OpenAI & Claude APIs, prompt architecture, cost-hardened endpoints.",
      ],
    },
    {
      n: "02",
      title: "Full Stack Delivery",
      claim: "End-to-end web products, backend to pixels",
      lines: [
        "Laravel, Vue/Nuxt, React/Next.js — 7+ years of shipped systems for real businesses.",
        "Payments (Stripe, Razorpay), integrations, and the unglamorous plumbing done right.",
      ],
    },
    {
      n: "03",
      title: "Architecture & Leadership",
      claim: "Solution design and teams that deliver",
      lines: [
        "Tech Lead at MM Novatech: system design, code review culture, and delivery cadence.",
        "From requirements to running infrastructure without the enterprise theater.",
      ],
    },
  ],

  featuredWork: {
    lead: {
      title: "BudgetGen — Smart Finance Manager",
      href: "https://github.com/adityakdevin/budgetgen",
      story:
        "A personal-finance manager built end-to-end in Laravel: budgets, tracking, reports. Designed, built, and shipped solo — schema to UI.",
      stack: "PHP · Laravel · MySQL",
    },
    links: [
      {
        title: "Payments & integrations toolkit",
        href: "https://github.com/adityakdevin?tab=repositories",
        note: "Stripe, Razorpay for WooCommerce, AWS S3 uploads, PDF pipelines",
      },
      {
        title: "Laravel + AI article series",
        href: "https://dev.to/adityakdevin",
        note: "Building AI features in Laravel, from chatbots to streaming",
      },
    ],
  },

  verify: [
    {
      claim: "8.3k+ contributions on GitHub",
      href: "https://github.com/adityakdevin",
      note: "the graph doesn't lie",
    },
    {
      claim: "Published Laravel + AI engineering series",
      href: "https://dev.to/adityakdevin",
      note: "read the actual articles",
    },
    {
      claim: "7+ years, currently Tech Lead @ MM Novatech",
      href: "https://www.linkedin.com/in/adityakdevin",
      note: "career history on LinkedIn",
    },
  ],

  // Testimonial slot ships hidden (SPEC §5.5) — first real quote turns it on. No fake quotes, ever.
  testimonials: [] as { quote: string; author: string; role: string }[],

  skills: {
    "Backend & AI": ["PHP", "Laravel", "Python", "OpenAI API", "Claude API", "Node.js"],
    Frontend: ["Vue.js", "Nuxt", "React", "Next.js", "TypeScript", "Tailwind CSS"],
    "Data & DevOps": ["MySQL", "PostgreSQL", "Redis", "Docker", "AWS", "GitHub Actions"],
  },

  experience: [
    {
      role: "Tech Lead",
      company: "MM Novatech",
      period: "Current",
      points: [
        "Leading solution architecture and delivery for client web products.",
        "Shipping AI features (LLM chatbots, automation) into production apps.",
      ],
    },
    {
      role: "Full Stack Developer",
      company: "Webtechgen",
      period: "Earlier",
      points: [
        "Full-stack delivery for client projects: Laravel backends, Vue/React frontends.",
        "Led development of remaxmillennium.ca, a Canadian real-estate platform.",
      ],
    },
  ],

  education: "Master's degree",
} as const;

export type Profile = typeof profile;
