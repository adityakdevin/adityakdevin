/**
 * Single source of truth (SPEC S3): structured facts only.
 * Consumed by: home, /cv, lib/jsonld.ts, llms.txt generation, bot prompt (P3).
 */
export const profile = {
  name: "Aditya Kumar",
  handle: "adityakdevin",
  headline: "Full Stack Developer · AI Engineer · Solution Architect",
  valueLine: "I build Laravel & AI products that ship.",
  // The sharp version, rendered in the hero and on /hire. valueLine stays broad
  // because llms.txt, JSON-LD and the bot corpus all read it and should keep the
  // full-stack breadth. This used to be a second copy inside app/hire/page.tsx.
  heroLine: "I ship production AI/LLM features into Laravel & Node apps - not demos.",
  role: "Tech Lead",
  company: "MM Nova Tech",
  yearsExperience: "9+",
  location: "Lucknow, Uttar Pradesh, India",
  email: "contact@adityadev.in",
  phone: "+91 8299358996" as string | null,
  website: "https://adityadev.in",
  bookingUrl: "https://cal.com/adityakdevin/30min",
  github: "https://github.com/adityakdevin",
  linkedin: "https://www.linkedin.com/in/adityakdevin",
  twitter: "https://twitter.com/adityakdevin",
  upwork: "https://www.upwork.com/freelancers/adityakdevin",
  freelancer: "https://www.freelancer.com/u/aditaykumar2012",
  peopleperhour: "https://pph.me/adityakdevin",
  devto: "https://dev.to/adityakdevin",
  devtoUsername: "adityakdevin",

  metrics: [
    { value: "9+", label: "years shipping" },
    { value: "60+", label: "projects delivered" },
    { value: "8.3k+", label: "GitHub contributions" },
    // Was "1 Laravel + AI series", which at 48px read as padding next to 8.3k+.
    // Hardcoded, not derived: only 3 of 4 posts are series posts and a unit test
    // pins that array at 4.
    { value: "2", label: "case studies" },
  ],

  services: [
    {
      n: "01",
      title: "AI Integration",
      claim: "Chatbots, automations, and AI workflows that survive real users",
      lines: [
        "LLM chatbots, streaming interfaces, and automation wired into real products - not demos.",
        "OpenAI & Claude APIs with rate limits, spend caps, streaming and evals - because an AI feature is judged by what happens when the API is slow, wrong, or down.",
      ],
    },
    {
      n: "02",
      title: "Full Stack Delivery",
      claim: "I own the thing after it ships, not just until it merges",
      lines: [
        "Laravel, Vue/Nuxt, React/Next.js - 9+ years of shipped systems for real businesses.",
        "Payments (Stripe, Razorpay), integrations, and the unglamorous plumbing done right.",
      ],
    },
    {
      n: "03",
      title: "Architecture & Leadership",
      claim: "Solution design without the enterprise theater",
      lines: [
        "Tech Lead at MM Nova Tech: system design, code review culture, and delivery cadence.",
        "From requirements to running infrastructure, with the decisions written down where the next engineer will find them.",
      ],
    },
  ],

  featuredWork: {
    lead: {
      title: "BudgetGen - Smart Finance Manager",
      href: "https://github.com/adityakdevin/budgetgen",
      story:
        "A personal-finance manager built end-to-end in Laravel: budgets, tracking, reports. Designed, built, and shipped solo - schema to UI.",
      stack: "PHP · Laravel · MySQL",
      // Headline outcome, rendered inline on the home card when set. Null until a
      // real, honest number exists - never fabricate (E4).
      metric: null as { value: string; label: string } | null,
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
      claim: "9+ years, currently Tech Lead @ MM Nova Tech",
      href: "https://www.linkedin.com/in/adityakdevin",
      note: "career history on LinkedIn",
    },
    // The section is called "verify me yourself" and cited a contribution graph
    // three times. These two are the ones where the numbers name their source.
    {
      claim: "A public LLM endpoint with a $10 hard spend cap",
      href: "/work/askaditya-terminal-assistant",
      note: "every guardrail, with the file it lives in",
    },
    {
      claim: "A claims linter that blocks my own unbacked numbers",
      href: "/work/shipping-a-claims-lens",
      note: "including the part where it was broken",
    },
    // Sixth entry also closes the two-column grid, which had an odd count.
    {
      claim: "This site's source is public - endpoint, guardrails and all",
      href: "https://github.com/adityakdevin/adityakdevin",
      note: "read the code behind every claim above",
    },
  ],

  // Testimonial slot ships hidden (SPEC S5.5) - first real quote turns it on. No fake quotes, ever.
  testimonials: [] as { quote: string; author: string; role: string }[],

  skills: {
    Languages: ["PHP", "JavaScript", "TypeScript", "Python", "SQL", "HTML5", "CSS"],
    "Backend & AI": ["Laravel", "Livewire", "CakePHP", "CodeIgniter", "Node.js", "FastAPI", "OpenAI API", "Claude API"],
    Frontend: ["Vue.js", "Nuxt", "React", "Next.js", "Angular", "jQuery", "Tailwind CSS"],
    Databases: ["MySQL", "PostgreSQL", "SQLite", "Redis"],
    "Cloud & DevOps": ["AWS (EC2, S3)", "Azure AD", "DigitalOcean", "Docker", "GitHub Actions", "cPanel"],
    Integrations: ["Stripe", "Razorpay", "Dwolla", "DocuSign", "Mapbox"],
    CMS: ["WordPress", "Magento"],
  },

  // Experience shape stays backward-compatible with lib/prompt.ts (role/company/period/points);
  // `location` is additive. Dates confirmed against LinkedIn (2026-07).
  experience: [
    {
      role: "Tech Lead (Full-Stack & AI)",
      company: "MM Nova Tech",
      period: "Feb 2021 - Present",
      location: "Remote (India)",
      points: [
        "Promoted to Tech Lead (Apr 2022); lead architecture and delivery across a team of 10+ engineers building client web products.",
        "Ship production AI/LLM features - chatbots, streaming assistants, and workflow automation - on OpenAI and Claude APIs, with cost-hardened, rate-limited endpoints.",
        "Own solution design end to end: Laravel/PHP backends, Vue and React/Next.js frontends, payments, and cloud infrastructure (AWS, Azure AD, DigitalOcean).",
        "Established code-review culture and delivery cadence; mentor engineers and set technical standards.",
      ],
    },
    {
      role: "Full-Stack Developer (Freelance)",
      company: "Webtechgen - Self-employed",
      period: "Jul 2019 - Feb 2022",
      location: "India (concurrent)",
      points: [
        "Delivered client web platforms end to end, including remaxmillennium.ca, a Canadian real-estate portal.",
        "Built and integrated payment, e-signature, and mapping systems (Stripe, Razorpay, Dwolla, DocuSign, Mapbox) across client products.",
      ],
    },
    {
      role: "Senior Web Developer",
      company: "Starlink Logistics Pvt. Ltd.",
      period: "May 2016 - Jun 2017",
      location: "India",
      points: [
        "Built and maintained logistics web applications with PHP/Laravel and MySQL.",
      ],
    },
    {
      role: "Web Developer",
      company: "CSRDGROUP",
      period: "Jun 2015 - Apr 2016",
      location: "Lucknow, India",
      points: [
        "Developed client websites and web apps; built a foundation in PHP, MySQL, and front-end delivery.",
      ],
    },
  ],

  // Curated for the CV (distinct from featuredWork on the home page). Real client work.
  projects: [
    {
      title: "RO - Real-estate platform",
      href: "https://r-o.com",
      note: "Upgraded Laravel 5.1 -> 6.x and integrated Mapbox API plus Azure AD SSO.",
      stack: "PHP · Laravel · Mapbox · Azure AD",
    },
    {
      title: "JPI System",
      href: "https://apps.jpi.com",
      note: "Built from scratch in Laravel 8 + Livewire with Dwolla ACH payments.",
      stack: "PHP · Laravel · Livewire · Dwolla",
    },
    {
      title: "AWB System",
      href: "https://awbsystem.com",
      note: "Airway-bill management with DocuSign e-signature integration.",
      stack: "PHP · CodeIgniter · DocuSign",
    },
    {
      title: "Mitadass - E-commerce",
      href: "https://mitadass.com",
      note: "Storefront built from scratch with Razorpay checkout.",
      stack: "PHP · Laravel · Razorpay",
    },
    {
      title: "BudgetGen - Smart Finance Manager",
      href: "https://github.com/adityakdevin/budgetgen",
      note: "Personal-finance manager built solo end to end - schema to UI.",
      stack: "PHP · Laravel · MySQL",
    },
  ],

  openSource: [
    {
      title: "VikSslcommerz",
      href: "https://github.com/adityakdevin/VikSslcommerz",
      note: "SSLCommerz payment gateway plugin for VikBooking (Joomla) - most-starred repo.",
    },
    {
      title: "Laravel utility repos",
      href: "https://github.com/adityakdevin?tab=repositories",
      note: "stripe-payments, add-watermark-pdf (PDF pipelines), s3upload (AWS S3) - reusable, open-sourced.",
    },
    {
      title: "8.3k+ GitHub contributions",
      href: "https://github.com/adityakdevin",
      note: "Consistent, public shipping history.",
    },
  ],

  languages: [
    { name: "English", level: "Professional" },
    { name: "Hindi", level: "Native" },
  ],

  // No certifications on record yet - section is omitted when empty. Never fabricate.
  certifications: [] as { name: string; issuer: string; year: string }[],

  education: [
    {
      degree: "Master of Computer Applications (MCA), Computer Science",
      school: "Integral University, Lucknow",
      year: "2017",
      score: "85.10%",
    },
    {
      degree: "PG Diploma in Web Designing",
      school: "Government Polytechnic, Lucknow",
      year: "2015",
      score: "70.73%",
    },
    {
      degree: "B.Sc.",
      school: "M. J. P. Rohilkhand University, Bareilly",
      year: "2014",
      score: "58%",
    },
  ],
} as const;

export type Profile = typeof profile;
