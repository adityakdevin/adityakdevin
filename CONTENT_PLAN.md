# Content Plan — adityadev.in (July 2026)

> **Reviewed 2026-07-17** (/office-hours + /plan-eng-review). The engineering
> source of truth is the design doc
> `~/.gstack/projects/adityakdevin-adityakdevin/adityakdevin-master-design-20260717-031600.md`
> (Status: APPROVED, review report CLEAR). Deltas folded in below: Buttondown
> (not Resend — contact runs Mailtrap), leads-primary metric with instrumented
> attribution, and a service-intent page.

Goal for the next 6 months: **freelance/client leads**. Every post ends with a
"work with me" CTA pointing at the contact form. Jobs, audience, and product
sales are side effects, not targets.

## Positioning

**"The engineer who ships production AI features that work — across Laravel,
Node.js, and Python — and shows the whole build, with real clients and real
numbers."**

Broadened 2026-07-17 from Laravel-only to full-stack AI (equal billing across
the three stacks). The differentiator is **not the stack — it's proven,
production, real-client, real-number delivery**, which is stack-independent.
Laravel, Node, and Python are equal proof of range; rotate them so none reads as
a footnote.

**SEO consequence (accepted tradeoff, needs action):** equal billing dilutes the
existing "hire Laravel AI developer" search equity. Do NOT genericize the working
Laravel service page — keep it as one specialized SEO pillar and add **sibling
service pages** (`/services/nodejs-ai-development`, `/services/python-ai-development`)
so each stack still ranks for its own commercial-intent queries. Generic
"full-stack AI developer" is a crowded, low-intent search term; specialized
per-stack pages beat it. See decisions log.

Audience answered "anyone" in the interview; the plan resolves that to
**founders and CTOs** as the primary reader (walkthroughs serve both). Local
India SMB / city-service pages are a separate later track — do not mix that
language into blog posts.

## Content mix (2 posts/month, AI-drafted + human-edited)

| Share | Type | Purpose |
|-------|------|---------|
| ~60% | **End-to-end build walkthroughs** — idea → Laravel/Livewire build → deploy, in a multi-part series per project | Pillar. Ranks for "how to build X", proves capability |
| ~25% | **Laravel + AI** — repurposed/continued from the existing Dev.to bi-weekly series | Existing asset, feeds the same Laravel association |
| ~15% | **Named client case studies** with real metrics (client has approved names + numbers) | Conversion content, linked from every walkthrough |

## Distribution

1. Publish on **adityadev.in/blog** first (canonical).
2. Cross-post to Dev.to with `canonical_url` pointing back — update the
   `/draft-devto-post` pipeline to set `canonical_url` and publish site-first.
3. Newsletter capture on every post from day one (simple form + one provider).

## Build (one-time, in `site/`)

- `/blog` route + `/blog/[slug]`, posts as **MDX in `site/content/posts/`**
  (no CMS). Extend existing `sitemap.ts`, add RSS, per-post OG image,
  `Article` JSON-LD.
- Newsletter form component + **Buttondown** wiring (`/api/subscribe` proxy;
  Buttondown owns double-opt-in/unsubscribe). ✅ built 2026-07-17.
- Service-intent page `/services/laravel-ai-development` targeting commercial
  variants ("hire Laravel AI developer" / "Laravel AI integration expert") —
  the homepage keeps its own §1 query. Offer: fixed-scope AI Integration
  Audit. ✅ built 2026-07-17.
- Expand `/work` case studies with named clients + metrics; cross-link
  blog ↔ work.
- GSC is set up and baseline is known — record baseline numbers before the
  first post ships; review monthly.

## First 6 posts (3 months)

1. Walkthrough part 1: pick one real client project — "Building [X] with
   Laravel + Livewire: scoping and data model"
2. Case study: same project, named client, before/after numbers
3. Walkthrough part 2: the hard part of the build (auth/payments/queues —
   whatever it actually was)
4. Laravel + AI: next post in the existing series, site-first this time
5. Walkthrough part 3: deploy, monitoring, what it costs to run
6. "What it actually costs to build a [X] in 2026" — founder-targeted,
   highest commercial intent

## AI content themes (Laravel-framed backlog)

Topic backlog for the AI track (~25% of the mix). **Spine rule: every one is
told through a real production build (Laravel, Node, or Python) with code and,
where possible, client numbers.** Generic AI think-pieces (model news, prompting
tips in the abstract) are commodity content and do NOT belong on the blog — they
live on X only. Each theme is a walkthrough, not commentary. **Rotate the stack**
across posts so all three read as first-class.

| Theme | Blog framing (production-AI spine, stack rotated) | Lead value |
|-------|--------------------------------------------------|------------|
| **AI automation** | "Automating [real client workflow] — X hrs → Y min" (Laravel queue / Node worker / Python job) | **High** — founder-facing; what buyers pay for |
| **E2E AI workflows** | "End-to-end: idea → build → deployed AI workflow, with run cost" (pick the stack the client used) | **High** — proves capability + cost |
| **AI generation** | "Generating [invoices/reports/replies] in production — code + guardrails" (any stack) | Medium — dev-facing, some buyer pull |
| **Prompting** | "Prompt engineering *inside* a shipped feature: versioning, testing, cost control" (any stack) | Medium — ties abstract skill to shipped code |
| **New AI Era / model updates** | Not a blog post. X-only, ephemeral. | Low — reach, not leads |

Sequencing: fold the two High-value themes (AI automation, E2E workflows) into
the walkthrough + case-study cadence; treat AI generation / prompting as the
continuing AI series posts; keep model-news on X. Rotate Laravel / Node / Python
so the blog proves range without any one stack becoming a footnote. Do not let
the backlog pull the blog off the "production AI for real clients, real numbers"
positioning — that spine holds regardless of language.

## Success check (eng review D6/D15 — leads primary, instrumented)

**Primary (month 4+):** ≥3 attributable leads — measured, not self-reported:
the contact form stamps `source_page`/`first_landing`/`referrer` into every
notification email, and cal.com links from posts carry `?ref=<slug>`.
Branded-search impressions trending up in GSC.

**Leading (weeks 2–12):** service page + first cluster indexed; impressions
growing; spot-checked AI-engine citations.

**Checkpoints:** month 4 adjusts intent mix and titles (never kills — SEO lead
lag on a new surface can exceed 4 months); kill decisions wait for month 6+
with instrumented data. If impressions but no clicks, fix titles; clicks but
no leads, fix the offer/CTA — before changing strategy.
