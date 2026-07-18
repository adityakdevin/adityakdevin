# Spec - Node.js & Python AI service pages (SEO siblings)

> Build-ready. Mirrors `site/app/services/laravel-ai-development/page.tsx`.
> Rationale: `CONTENT_PLAN.md` positioning broadened to full-stack AI (Laravel +
> Node + Python) 2026-07-18. Equal billing dilutes the "hire Laravel AI
> developer" SERP equity, so each stack gets its **own specialized page** that
> ranks for its own person-intent commercial queries - NOT one genericized
> "full-stack AI developer" page (crowded, low intent).

## Why (no-cannibalization map)

Each surface owns a distinct query cluster; no two compete:

| Surface | Owns |
|---------|------|
| Homepage (`/`) | "Laravel AI integration developer India" (spec S1) |
| `/services/laravel-ai-development` | "Laravel AI integration expert", "freelance Laravel AI developer" |
| **`/services/nodejs-ai-development`** (new) | "Node.js AI developer", "hire AI engineer Node/Next.js", "TypeScript AI integration" |
| **`/services/python-ai-development`** (new) | "Python AI developer", "FastAPI/Django AI integration", "LangChain Python freelancer" |

Head terms ("AI developer") are owned by agency template pages - target the
person-intent commercial variants, same as the Laravel page's SERP note.

## Files

| File | Change |
|------|--------|
| `site/app/services/nodejs-ai-development/page.tsx` | New - copy the Laravel page, swap content below |
| `site/app/services/python-ai-development/page.tsx` | New - same |
| `site/app/sitemap.ts:23` | Add both routes (priority 0.9, monthly), mirroring the Laravel line |

No new components, no new deps. Reuse `NewsletterForm`, `jsonLdScript`,
`profile`, `SITE_URL`. Same layout, hero → capabilities → process → CTA → "Proof,
not promises" → newsletter.

## Page 1 - `/services/nodejs-ai-development`

**metadata**
```ts
title: "Node.js AI Integration Expert - hire a freelance AI engineer for Node/Next.js",
description:
  "I build AI features into Node.js and Next.js apps - chatbots, RAG, streaming, tool-calling agents - as a named engineer with 9+ years of shipped systems, not an agency bench. Fixed-scope AI Integration Audit available.",
alternates: { canonical: "/services/nodejs-ai-development" },
```

**serviceJsonLd** - same shape as Laravel, with:
- `@id`: `${BASE}/services/nodejs-ai-development#service`
- `name`: "Node.js AI integration development"
- `description`: "AI integration for Node.js and Next.js applications: chatbots, retrieval-augmented generation, streaming responses, and tool-calling agents with the Vercel AI SDK. Fixed-scope audit or full implementation."

**CAPABILITIES**
1. **AI features in your Node/Next.js app** - "Chat assistants, RAG over your own data, streaming responses, and tool-calling agents - built into your existing Next.js or Node backend with the Vercel AI SDK or direct provider APIs. Works with your App Router, edge or Node runtime, and existing auth. No rewrite."
2. **Production concerns handled, not demoed** - same body as Laravel (rate limiting, spend caps, prompt caching, streaming, failure modes, evals - the demo-vs-feature line).
3. **Full-stack delivery** - "`${profile.yearsExperience}` years shipping TypeScript/Node, Next.js, and React systems for real businesses. One person from data model to deployed feature - no handoffs."

**PROCESS** - identical to Laravel (30-min call / one-week fixed-scope audit /
build), with the audit line reading "I review your Node/Next.js codebase".

## Page 2 - `/services/python-ai-development`

**metadata**
```ts
title: "Python AI Integration Expert - hire a freelance AI engineer for FastAPI/Django",
description:
  "I build AI features into Python backends - FastAPI, Django - chatbots, RAG, document pipelines, and agents, as a named engineer with 9+ years of shipped systems, not an agency bench. Fixed-scope AI Integration Audit available.",
alternates: { canonical: "/services/python-ai-development" },
```

**serviceJsonLd**
- `@id`: `${BASE}/services/python-ai-development#service`
- `name`: "Python AI integration development"
- `description`: "AI integration for Python backends (FastAPI, Django): chatbots, retrieval-augmented generation, document processing pipelines, and agents with LangChain or direct provider APIs. Fixed-scope audit or full implementation."

**CAPABILITIES**
1. **AI features in your Python backend** - "Chat assistants, RAG over your own data, document-extraction pipelines, and agents - built into your existing FastAPI or Django app with LangChain or direct provider SDKs. Fits your existing models, tasks (Celery), and data layer. No parallel system."
2. **Production concerns handled, not demoed** - same body as Laravel.
3. **Full-stack delivery** - "`${profile.yearsExperience}` years shipping backend systems for real businesses, from data model to deployed feature. Python where the data and ML-adjacent work lives - one person, no handoffs."

**PROCESS** - identical, audit line reads "I review your Python codebase".

## Cross-links (do this in the same PR)

- Each new page's "Proof, not promises" section: link `/blog`, `profile.devto`,
  and `/work/budgetgen` (same as Laravel).
- Add a one-line "also: [Laravel](/services/laravel-ai-development) *
  [Node](/services/nodejs-ai-development) * [Python](/services/python-ai-development)"
  stack-switcher near the top of ALL THREE service pages, so a visitor on the
  wrong stack page finds the right one and Google sees the cluster interlinked.

## Acceptance criteria

1. Both routes render at `/services/nodejs-ai-development` and
   `/services/python-ai-development`, 200, with the exact metadata above.
2. Each page's canonical points at its own slug (no cross-canonical).
3. Each emits a `Service` JSON-LD block with the stack-specific `@id`, `name`,
   `description`, and `provider: { "@id": "${BASE}/#aditya" }`.
4. `sitemap.ts` lists both new routes; `npx tsx`/build enumerates them without error.
5. All three service pages carry the stack-switcher interlink.
6. The Laravel page is UNCHANGED except for adding the stack-switcher line.
7. `npm test` green; `tsc --noEmit` clean; no new dependencies.

## Out of scope

- Rewriting the homepage S1 query (it stays "...India"; no overlap).
- Blog content for Node/Python (that's the `CONTENT_PLAN.md` theme backlog).
- Paid landing pages / ad copy (separate track).

## Effort

~30-45 min: the pages are a mechanical copy + per-stack content swap already
written above. The only real decision (SERP target terms) is made here.
