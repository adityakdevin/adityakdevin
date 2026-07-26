/** Case studies (SPEC S5 P2). Own-work first; client studies land here once written permission exists (S13.2). */

/**
 * `source` is REQUIRED. The homepage promises "every claim links to a source you
 * can check in ten seconds" and this type could not honour it - a URL, a file
 * path, or a named artifact, but never nothing.
 */
export type CaseStudyOutcome = { metric: string; value: string; source: string };

export type CaseStudySection = {
  h: string;
  /** One string or several paragraphs. Seven sections at one paragraph each is not a case study. */
  body: string | string[];
  /**
   * Monospaced block rendered after the body - architecture diagrams, request
   * flows, config. Rendered with its own overflow-x: this page has no
   * .prose-post wrapper, so globals.css's pre rule never reaches it.
   */
  pre?: string;
};

export type CaseStudy = {
  slug: string;
  title: string;
  /** Publication date, yyyy-mm-dd. Drives the /work sort order. */
  date: string;
  summary: string;
  stack: string[];
  sections: CaseStudySection[];
  /** Public repo. Optional - client work usually has none; guard every render on presence. */
  repo?: string;
  /** Live URL, when the work is publicly reachable. */
  liveUrl?: string;
  /** Client attribution for client studies (use "Client A" when named permission is pending). */
  client?: string;
  role?: string;
  period?: string;
  /** Headline outcomes rendered as a mono stat row. Every value carries its source. */
  outcome?: CaseStudyOutcome[];
  /** Same shape as profile.testimonials so one renderer serves both. */
  testimonial?: { quote: string; author: string; role: string };
  /**
   * Publication gate. Only `published: true` studies are reachable at /work/<slug>,
   * listed on /work, or in the sitemap. A draft client study committed here stays
   * 404 until permission is on file and this is flipped. See ceo-plan D4b.
   */
  published?: boolean;
};

export const caseStudies: CaseStudy[] = [
  {
    slug: "askaditya-terminal-assistant",
    title: "AskAditya - a public LLM endpoint that cannot run up a bill",
    date: "2026-07-26",
    summary:
      "The terminal widget in the corner of this site answers questions about my work over a streaming LLM endpoint. It is open to the internet with no login, so most of the build is the part that stops it becoming someone else's free API.",
    stack: ["Next.js", "TypeScript", "Vercel AI SDK", "AI Gateway", "Claude Haiku 4.5"],
    liveUrl: "https://adityadev.in",
    published: true,
    outcome: [
      {
        metric: "monthly spend ceiling, enforced in code",
        value: "$10",
        source: "site/app/api/chat/route.ts (SPEND_CAP_USD)",
      },
      {
        metric: "questions per hour, per IP",
        value: "10",
        source: "site/app/api/chat/route.ts (createRateLimiter)",
      },
      {
        metric: "max tokens the model may spend on a reply",
        value: "500",
        source: "site/app/api/chat/route.ts (MAX_OUTPUT_TOKENS)",
      },
      {
        metric: "failure paths under test",
        value: "11",
        source: "site/tests/unit/chat-route.test.ts",
      },
    ],
    sections: [
      {
        h: "The problem",
        body: [
          "A portfolio makes a visitor read. A terminal lets them ask. The interesting version of 'tell me about your Laravel work' is the one where a hiring manager types it at 11pm and gets an answer grounded in facts I actually wrote down.",
          "The uninteresting version is the one where that endpoint is a public, unauthenticated, pay-per-token API sitting on my credit card. Every design decision here comes from that second sentence.",
        ],
      },
      {
        h: "The constraints",
        body: [
          "No login, because asking a stranger to sign up before they can ask about my rate defeats the point. No tools and no function calling, so there is no path from a prompt to anything that costs more than one completion. No secrets in the corpus, because the whole system prompt is one adversarial question away from being read aloud.",
          "And a hard money ceiling that is enforced, not monitored. An alert tells me I have been billed. A circuit breaker means I have not.",
        ],
      },
      {
        h: "The architecture",
        body: "One route, four gates before the model is ever reached, and a corpus built from the same data files the pages render from - so the bot cannot drift from the site.",
        pre: `POST /api/chat
  |
  +-- content-length > 32KB?        -> 413   (before JSON.parse: no free CPU)
  +-- message empty or > 300 chars? -> 422
  +-- 10 requests this hour by IP?  -> 429
  +-- month-to-date spend >= $10?   -> 503   (circuit breaker, not an alarm)
  |
  v
streamText(model: anthropic/claude-haiku-4.5)
  system: full corpus, cache breakpoint, frozen at module load
  maxOutputTokens: 500
  |
  +-- stream chunks to the client as text/plain
  +-- on finish: costUsd(usage) -> recordSpend()

corpus  <- content/data/{profile,faq,work}.ts   (one source of truth)`,
      },
      {
        h: "Decisions that mattered",
        body: [
          "The body-size gate reads content-length and rejects before JSON.parse. The input cap is 300 characters, so anything past 32KB is not a long question, it is someone probing for a way to make my server work for free.",
          "The spend counter runs on the usage block the provider returns, priced in lib/cost.ts, not on an estimate. Guessing token counts is how a cap silently stops capping.",
          "The system prompt is frozen at module load rather than rebuilt per request. It has to be byte-stable for provider caching to engage at all, and the same property makes the corpus testable with a golden file.",
          "The widget answers ten commands - help, whoami, work, cv, skills, contact - with no model involved. AI is the fallback, not the feature. When the endpoint is unconfigured or the cap has tripped, the terminal is still useful instead of broken.",
        ],
      },
      {
        h: "What broke",
        body: [
          "The OG image route for case studies returned a rendered card for any slug. Satori renders a PNG per URL, so an unpublished slug returning 200 turned an image endpoint into an unauthenticated CPU amplifier: request 10,000 distinct slugs, get 10,000 renders. It now calls notFound() for anything not in the published set, exactly like the page does.",
          "The corpus builder assumed every case study had a public repo. Client work usually does not, and the template wrote the literal string 'undefined' into the cached system prompt for any study without one. The bot was reciting it. Guarded and pinned with a test.",
          "The third one I found by auditing my own docblock while writing this study. lib/prompt.ts claimed the corpus 'is served from Anthropic's prompt cache after the first request of each TTL window'. It was not. Nothing in the route set a cache breakpoint, so the full corpus was billed at input rate on every single request. The claim had been true as an intention and false as code since the day it shipped. The fix is four lines: the system message moves to its object form and carries an ephemeral cacheControl breakpoint, because the breakpoint has to sit on the message, not on the call.",
        ],
      },
      {
        h: "The outcome",
        body: [
          "It runs in the corner of this page. Open it and try to break it - the gates are the interesting part, and the source for every number above is one file path away.",
          "The reason this is the first case study on the site is that it is the one where I can show you the guardrails instead of describing them. Most AI integration work is not the prompt. It is the eleven tested failure paths behind it.",
        ],
      },
    ],
  },
  {
    slug: "shipping-a-claims-lens",
    title: "The lens that stops me lying about my own work",
    date: "2026-07-26",
    summary:
      "A placeholder number in a planning document was lifted, verbatim, into two published social drafts as a true client story. The fix was not being more careful. It was a linter for claims that runs on every commit.",
    stack: ["Node.js", "regex", "git hooks", "GitHub Actions"],
    published: true,
    outcome: [
      {
        metric: "claim patterns that hard-block a commit",
        value: "9",
        source: "scripts/text-hygiene.mjs (category: unpermissioned-claim)",
      },
      {
        metric: "patterns across all categories",
        value: "22",
        source: "scripts/text-hygiene.mjs (BANNED_PHRASES)",
      },
      {
        metric: "tests pinning the lens itself",
        value: "64",
        source: "scripts/text-hygiene.test.mjs",
      },
      {
        metric: "files scanned on every commit",
        value: "192",
        source: "npm run hygiene",
      },
    ],
    sections: [
      {
        h: "The problem",
        body: [
          "A voice document in this repo carried an example figure inside an '(e.g.)' placeholder. It was illustrative. It was not about anyone.",
          "A drafting pass picked it up and wrote it into a LinkedIn draft and an X draft as a first-person client outcome, with a timeframe attached. Two channels of the same pack cited two different numbers for the same imaginary fact, which is the only reason anyone noticed at all. Nothing was published. Nothing in the repo could have stopped it if it had been.",
        ],
      },
      {
        h: "The constraints",
        body: [
          "A checklist does not work, because the failure mode is not carelessness, it is a plausible sentence arriving from a file that was never meant to be a source.",
          "So the gate has to be mechanical, it has to run without being remembered, and it has to fail closed. It also has to be quiet enough that it does not get switched off: a check that cries wolf gets bypassed within a week, which means false positives are not a cosmetic problem, they are the whole risk.",
        ],
      },
      {
        h: "The architecture",
        body: "Two lenses over the same file walker. The character lens is mechanical and fixable in place. The claims lens needs judgment, so it reports and blocks but never rewrites.",
        pre: `git commit
  |
  +-- .git/hooks/pre-commit
  |     node text-hygiene.mjs --staged            (characters: fixable)
  |     node text-hygiene.mjs --staged --phrases  (claims: judgment)
  |
  v  push
GitHub Actions: npm run hygiene && lint && test

--phrases categories:
  ai-vocab            the assistant-shaped adjectives (22 patterns total)
  round-number        a tidy percentage range -> asks for an odd specific
  unpermissioned-claim  9 patterns: client outcomes, shipped counts,
                        dated client interactions, self-funding claims
  launch-cosplay

exemptions are per-CATEGORY, not per-file:
  voice.md is exempt from round-number
  voice.md is NOT exempt from unpermissioned-claim   <- the point`,
      },
      {
        h: "Decisions that mattered",
        body: [
          "Exemptions are scoped to categories, not files. The document that defines the banned vocabulary necessarily contains it, so scanning it for ai-vocab is guaranteed noise. But the same document held six quotable first-person client claims for weeks, and an all-or-nothing exemption is exactly why nothing noticed. It is exempt from the vocabulary categories and permanently subject to the claims ones.",
          "The claims lens refuses to run with --fix. There is no transliteration of an un-permissioned claim into a permitted one; the only fixes are 'cut it' or 'get permission and write it into the allowlist with its caveat'. A tool that offered to auto-fix this would be lying about what it does.",
          "Permission from the client is not sufficient on its own. The figure also has to land in the allowlist with its exact scope, because a number without its caveat is a different claim.",
          "The patterns stay in the past tense on purpose. A retrospective claim that a project funded itself is a statement about one engagement and needs permission. The present-tense version of the same words is an argument about a category, which anyone is free to make. Widening the pattern to catch both would have blocked a general thesis and forced an allowlist entry for the one file it caught, and that is how a gate starts collecting exceptions and then gets ignored.",
        ],
      },
      {
        h: "What broke",
        body: [
          "The gate was armed against the wrong thing for weeks. Only the character lens ran in the pre-commit hook. The claims lens existed, had 64 passing tests, and had never scanned a single published file - the npm script ran it without --phrases, which silently selects the other lens.",
          "Worse, the documented per-post ritual called it with --phrases and no path. That scans zero files and exits 0, printing '0 file(s) scanned, clean.' Every post would have passed through a check that was structurally incapable of failing.",
          "And it lived only in .git/hooks, which is not versioned, absent on a fresh clone, and skipped by --no-verify. It now runs in CI, where the machine doing the committing does not get a vote.",
        ],
      },
      {
        h: "The outcome",
        body: [
          "Turning the claims lens on across the repo produced 17 findings, and every one was a false positive in a file that quotes the banned patterns in order to define or test them. That was the reassuring result: the published surface was clean, and the exemptions needed to describe why those four files are different rather than waving them through.",
          "The reason this is a case study and not a footnote: most engineering trust problems are solved by being more careful, right up until the day they are not. This is what the mechanical version looks like, including the part where the mechanism itself was broken and had to be caught by using it.",
        ],
      },
    ],
  },
  {
    slug: "budgetgen",
    title: "BudgetGen - Smart Finance Manager",
    date: "2026-06-01",
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
