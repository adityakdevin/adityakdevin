/** Case studies (SPEC S5 P2). Own-work first; client studies land here once written permission exists (S13.2). */

export type CaseStudyOutcome = { metric: string; value: string };

export type CaseStudy = {
  slug: string;
  title: string;
  query: string;
  summary: string;
  stack: string[];
  sections: { h: string; body: string }[];
  /** Public repo. Optional - client work usually has none; guard every render on presence. */
  repo?: string;
  /** Live URL, when the work is publicly reachable. */
  liveUrl?: string;
  /** Client attribution for client studies (use "Client A" when named permission is pending). */
  client?: string;
  role?: string;
  period?: string;
  /** Headline outcomes rendered as a mono stat row. */
  outcome?: CaseStudyOutcome[];
  /**
   * Publication gate. Only `published: true` studies are reachable at /work/<slug>,
   * listed on /work, or in the sitemap. A draft client study committed here stays
   * 404 until permission is on file and this is flipped. See ceo-plan D4b.
   */
  published?: boolean;
};

export const caseStudies: CaseStudy[] = [
  {
    slug: "budgetgen",
    title: "BudgetGen - Smart Finance Manager",
    query: "laravel personal finance app case study",
    summary:
      "A personal-finance manager built end-to-end in Laravel: budgets, expense tracking, and reports - designed, built, and shipped solo.",
    stack: ["PHP", "Laravel", "MySQL", "Blade", "Chart.js"],
    repo: "https://github.com/adityakdevin/budgetgen",
    published: true,
    sections: [
      {
        h: "The problem",
        body: "Most budgeting apps are either spreadsheets with extra steps or subscription services that want your bank credentials. I wanted a self-hosted tool where a household can set monthly budgets per category, log expenses in seconds, and actually see where the money goes - without handing financial data to a third party.",
      },
      {
        h: "The build",
        body: "Classic Laravel monolith, deliberately boring where it should be: Eloquent models for accounts, categories, budgets and transactions; policy-based authorization so a household can share one instance; scheduled jobs that roll budgets over month-to-month and flag overspend early. Reporting is server-rendered with Chart.js on top - no SPA overhead for what is fundamentally a forms-and-tables product.",
      },
      {
        h: "Decisions that mattered",
        body: "Budget rollover is computed, never stored - one source of truth for balances killed a whole class of drift bugs. Categories are user-defined but seeded with sensible defaults, which turned out to be the difference between 'set up in two minutes' and abandonment. And keeping it self-hosted made privacy the feature, not a compliance checkbox.",
      },
      {
        h: "The outcome",
        body: "In daily use since launch for real household budgeting. The codebase doubles as my reference implementation for Laravel fundamentals done cleanly - the same patterns (policy auth, computed aggregates, scheduled rollovers) now show up in my client work.",
      },
    ],
  },
];

/** The publication gate, applied once. Every consumer (routes, index, sitemap, bot corpus) filters through this. */
export const publishedCaseStudies = caseStudies.filter((c) => c.published === true);
