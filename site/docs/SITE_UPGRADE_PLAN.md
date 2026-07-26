# adityadev.in - execution plan (final)

All paths are relative to `/Users/adityakdevin/Projects/adityakdevin/site` unless they start with `../` (monorepo root: `/Users/adityakdevin/Projects/adityakdevin`). Effort tags: **S** ≤ 30 min, **M** ≤ half a day, **L** ≥ a day.

---

## Where this stands

The engineering is better than the site. There's a live streaming LLM endpoint with a body-size gate, a 300-char input cap, per-IP rate limiting, a 500-token output ceiling and a $10/mo circuit breaker - and none of it is presented as proof anywhere a buyer looks. The commercial pages are the weakest surface: three `/services/*` pages at sitemap priority 0.9 have zero inbound internal links, `/hire` has a one-word title tag, no price and no test, and `/work` 404s because only one case study is published. The proof layer is empty by design - `testimonials: []`, `metric: null`, `outcome` unused - which is honest but leaves the "Proof: systems that run businesses" headline unsupported. Four real client systems with live URLs sit in `content/data/profile.ts` and render as unclickable text on `/cv`. The blog is four posts, three Laravel, one of which ends by naming a next post that was never written. An ASCII-clean sweep emptied three interactive glyphs, so the theme toggle and terminal close button ship as blank 44×44 boxes. The visual system is fine - one accent, one mono, one token set, a consistent 36px-title-plus-cyan-bar signature across ten pages.

Two things the plan's own guardrails don't cover, and both gate everything downstream:

- **The claims lens has never scanned the site.** `npm test` = turbo → `site: vitest run` + `scripts: node --test` (the lens's own unit tests). `npm run hygiene` is `--all` *without* `--phrases`, i.e. character lens only. No site MDX, TSX or data file has ever been claims-checked. This plan adds 12 posts, a price band, 6 case studies and 3 service-page rewrites into that blind spot.
- **One real production bug exists** - `lib/prompt.ts:6-9` claims the corpus "is served from Anthropic's prompt cache"; `app/api/chat/route.ts:92-98` sets `providerOptions: { gateway: { tags, user: ip } }` and no `cacheControl` anywhere. Verified.

**Leverage order:** this is an evidence-and-graph problem, not a design problem. Blank glyphs and a11y bugs get fixed first because they read as a broken build; everything visual waits until there's content worth navigating.

---

## Phase 0 - Stop the bleeding + arm the gates (one day)

**Goal:** nothing renders as broken, no reader hits an unreadable page, and the guardrails the later phases depend on can actually fail.

| # | Task | Files | Effort |
|---|---|---|---|
| 0.1 | Blog posts blow out to 768px at a 390px viewport (measured: `/blog/streaming-...`, `/blog/building-ai-agents-...`, `/blog/rag-...` all report `scrollWidth 768, clientWidth 390`). Cause is `mx-auto` suppressing `align-self: stretch` on a flex-col body, so `<main>` sizes to the min-content of the longest **unbreakable inline token in prose** (`overflow-wrap: break-word` does not reduce min-content contribution). Not `pre` - `globals.css:161` already sets `overflow-x: auto` on `.prose-post pre`, whose automatic min-width is therefore 0. Fix: `<main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">`. Confirmed `main{width:100%}` drops 768→390. Repeat on `app/blog/page.tsx:21` as cheap insurance. | `app/blog/[slug]/page.tsx:37` | S |
| 0.2 | Close the test hole - **one word.** `tests/fixtures/posts/a-very-long-slug-....mdx` already ends with a 124-char unbroken URL in a paragraph, so no fixture change is needed. `window.innerWidth` reports **768** under Playwright `isMobile` while `document.documentElement.clientWidth` stays **390**: change `window.innerWidth` → `document.documentElement.clientWidth` at `tests/e2e/blog.spec.ts:47`. `tests/e2e/home.spec.ts:120` already compares `scrollWidth > clientWidth` - **leave it alone.** | `tests/e2e/blog.spec.ts:47` | S |
| 0.3 | Three emptied glyphs, one pass. `components/ThemeToggle.tsx:51` → `{theme === null \|\| theme === "dark" ? "◐" : "◑"}` and delete the dead `iconProps` const at 15-25 (eslint flags it). `components/Terminal.tsx:258` → `{"[x]"}`, matching the launcher's `{">_"}`. `app/page.tsx:151` → `[ok]` in the accent span; **keep `gap-2`**, it's the only separator between the claim link and the `- {v.note}` span. | 3 files | S |
| 0.4 | Guard against the next sweep: one e2e assertion that the theme toggle and terminal close button have non-empty text content. `../scripts/text-hygiene.mjs` is what emptied them and nothing catches an element that renders blank. `◐`/`◑` (U+25D0/1) and `×` (U+00D7) pass the gate; ``, ``, ``, `` do not. | `tests/e2e/home.spec.ts` | S |
| 0.5 | **Prompt cache is claimed but not enabled.** Add `anthropic: { cacheControl: { type: "ephemeral" } }` to `providerOptions` alongside the existing `gateway` block, keeping `tags` and `user`. If the gateway path rejects it, the fallback is deleting the claim from the docblock - but not leaving both. Gates post 4 and case study #1. | `app/api/chat/route.ts:92-98`, `lib/prompt.ts:6-9` | S |
| 0.6 | **Make the claims lens scan the site.** `node ../scripts/text-hygiene.mjs --phrases --all` reports 17 findings today, all in `../CONTENT_VOICE_PLAN.md`, `../apps/social-poster/` and the lens's own test file. Triage those (exempt the lens's test file, which by design holds blocked patterns), then add `--phrases` to root `hygiene`/`hygiene:fix` scripts in `../package.json` and one step to `../.github/workflows/main.yml`. Without this, Phases 2-4 write straight into a blind spot. | `../package.json`, `../.github/workflows/main.yml` | M |
| 0.7 | **Decide the `pays for itself` case.** `content/posts/ai-automation-that-pays-for-itself.mdx` - title, slug, sitemap entry, OG image - is the present-tense form of the blocked `paid for (itself\|themselves)` pattern, and `ops/voice.md`'s "Numbers I can cite" permits only two claims (sub-cent model-inference cost; agents capped at 5 rounds). Either allowlist the title explicitly in `text-hygiene.mjs` with a provenance comment, or the lens is selectively enforced and 0.6 is theatre. Post 10 links to this post. | `../scripts/text-hygiene.mjs` or the post | S |
| 0.8 | Hidden home header keeps 7 links focusable inside an `aria-hidden` subtree - the first tab stops on the page draw a focus ring above the viewport. Add `inert={!visible}` to the `<header>` and delete `aria-hidden={!visible}` (inert implies it). React 19.2.4 passes it through. | `components/StickyChrome.tsx:133,137` | S |
| 0.9 | Terminal input at `text-sm` triggers iOS auto-zoom on a `fixed inset-0` panel that auto-focuses on open, and Safari doesn't restore scale on blur. `text-base md:text-sm` on **both** `Terminal.tsx:305` (the `$` prompt) and `:315` (the input). | `components/Terminal.tsx` | S |
| 0.10 | Phone renders as inert text on the homepage. Use the pattern already at `app/cv/page.tsx:38`: `<li><a href={\`tel:${profile.phone.replace(/\s/g,"")}\`}>{profile.phone}</a></li>`. No helper - two call sites. | `app/page.tsx:258` | S |
| 0.11 | `/hire`'s booking CTA is the only one on the site with no attribution token: `withRef(profile.bookingUrl, "hire")`, import from `@/lib/site`. Its two header CTAs are ~36-38px and the only buttons on the site missing `min-h-11` - on the money page, above the fold. | `app/hire/page.tsx:39,40,47` | S |
| 0.12 | **Confirm analytics exists before four phases of attribution work.** `app/layout.tsx:73-76` renders nothing unless `NEXT_PUBLIC_GTM_ID` or `NEXT_PUBLIC_GA_ID` is set; local `.env.local` has only `VERCEL_OIDC_TOKEN`. Check the Vercel project (`prj_5mx3PKBa08zG1Rwj3CVMMz4odzrv`) env for one of the two. If neither is set, every `?ref=` verification in this plan is unfalsifiable - set it or strike those checks. | Vercel dashboard | S |

**Verification:** `npm test` green with 0.2's one-word change; `document.documentElement.scrollWidth === 390` on all four posts at 390×844; visible glyphs in both themes; Tab on `/` at desktop lands in the hero; `node ../scripts/text-hygiene.mjs --phrases --all` exits 0; two consecutive `/api/chat` calls show non-zero `cacheReadInputTokens` in the gateway usage log; a GA4 `ref=hire` event fires from `/hire` (only if 0.12 passed).

---

## Phase 1 - Un-orphan the graph (one day, highest ratio in the plan)

**Goal:** every indexable page is one hop from the homepage, and the machine-readable surfaces describe commercial content instead of the privacy policy. Content added to an orphaned cluster earns nothing, so this precedes Phases 2-4.

Orphaned set, verified: `/work` (index), `/now`, `/uses`, all three `/services/*`. `/hire` is desktop-header-only → zero mobile inbound links. `/blog` is fine.

| # | Task | Files | Effort |
|---|---|---|---|
| 1.1 | Make `ServiceStackNav`'s prop optional: `current?: "laravel" \| "node" \| "python"`. With no arg, `s.key === current` is false for all three and all render as links. Drop `<ServiceStackNav />` **immediately after the closing `</ul>` of the `divide-y` service rows and before the section's closing tag** on the homepage (its `mb-8` sits inside the `py-20`, so swap to `mt-8` there), and in the same relative position under "What I do" on `/hire`. Puts all three 0.9-priority pages one hop from root, reusing existing mono/token styling. **Do not** map `profile.services` rows to stack pages - "Full Stack Delivery" and "Architecture & Leadership" are not the Node and Python pages, and that array also renders on `/hire`. | `components/ServiceStackNav.tsx:14`, `app/page.tsx:90`, `app/hire/page.tsx:122` | S |
| 1.2 | Footer is 7 external links and one internal (`/privacy`, a raw `<a>` that full-reloads). Add a second `<nav aria-label="Site">` in the flex row reusing `mono flex flex-wrap gap-x-5 text-sm`: `/blog`, `/hire`, the three `/services/*`, `/now`, `/uses`. **Gate `/work` on `publishedCaseStudies.length >= 2`** - the same guard `app/work/page.tsx:11` and `app/sitemap.ts:33` use - or a footer on every route at every breakpoint links to a 404 until Phase 2 lands. Convert `/privacy` to `next/link`. This one diff fixes `/hire`-on-mobile, `/now` and `/uses`. Optional: `gap-y-2` on the Elsewhere nav. | `components/Footer.tsx:22,37,56` | S |
| 1.3 | Add `~/hire` to the empty right slot of the mobile identity bar (already `justify-between` with a single child). **This bar renders on `!isHome` only, so it does not cover `/hire`-from-homepage-on-mobile - 1.2's footer does.** Claim only what it does: subpages. **Do not** touch the 5-column bottom tab bar - trading `/#work` for `/hire` swaps proof for pitch and `/#work` has no other mobile path. | `components/StickyChrome.tsx:174-188` | S |
| 1.4 | Add the six missing routes to the `## Pages` block as **literal lines**: `/hire`, the three `/services/*`, `/now`, `/uses`. Deriving the block from `sitemap()` pulls `getAllPosts()` (fs read) into a `force-static` route and makes `tests/unit/llms-txt.test.ts` read authored content instead of fixtures - a rung-7 answer to a rung-5 problem. Revisit when the route count actually moves. | `app/llms.txt/route.ts:27-30` | S |
| 1.5 | `/hire`'s title tag is the single word "Hire". `app/layout.tsx:29`'s template appends ` · Aditya Kumar (adityakdevin)` (+31 chars), so a long title renders at ~92 chars and truncates. Use `title: { absolute: "Hire me - freelance Full Stack + AI Engineer" }`, or keep the template and use a ~30-char title. Deliberately **not** "Laravel + AI developer" - collides with `app/services/laravel-ai-development/page.tsx:18` and the anti-cannibalization split at its lines 9-16. | `app/hire/page.tsx:6` | S |
| 1.6 | RSS autodiscovery. Next merges `alternates` shallowly and every content page sets its own, so a root-only fix renders on `/` alone. Add `types: { "application/rss+xml": "/blog/rss.xml" }` in **three** places: root layout, `/blog`, `/blog/[slug]`. Skip the other nine pages. | `app/layout.tsx:33`, `app/blog/page.tsx:10`, `app/blog/[slug]/page.tsx:27` | S |
| 1.7 | Two one-line JSON-LD additions: `image: \`${BASE}/aditya-kumar.jpeg\`` on `personJsonLd()` (the 800×800 file is in `public/`, referenced nowhere) and `image: [\`${BASE}/blog/${post.slug}/opengraph-image\`]` on `articleJsonLd()` (that route already renders 1200×630). Makes every post eligible for article rich results. | `lib/jsonld.ts:10-30, 78-100` | S |
| 1.8 | `app/not-found.tsx` links `./cv` and nothing else - the page every dead inbound link lands on, in an internal-linking phase. Add `/blog`, `/hire`, and home. | `app/not-found.tsx` | S |
| 1.9 | Move `/hire`'s "Where to hire me" block below the ContactForm. Four fee-taking off-site exits currently sit between the pitch and the only form on the conversion page. Pure block move. | `app/hire/page.tsx:128-147` | S |
| 1.10 | Open the pricing FAQ by default: `faq.map((item, i) =>` then `<details open={i === 1}>`. The site's only price is behind a guess-which-of-six click. Server component, no handler. | `app/page.tsx:216` | S |
| 1.11 | `/hire` ships at sitemap priority 0.9 with **zero tests** while four phases rewrite it. Add a `tests/e2e/hire.spec.ts` smoke: 200, h1 present, booking link carries `?ref=hire`, contact form renders. Add `/hire` to the sitemap regression list at `tests/e2e/blog.spec.ts:169`, which currently names six paths and omits it. | `tests/e2e/hire.spec.ts`, `tests/e2e/blog.spec.ts:169` | S |
| 1.12 | Repo-root GitHub Pages leftovers (`../index.html`, `../_config.yml`, `../CNAME`) predate the Vercel site. Confirm nothing serves them, then delete. If `CNAME` is load-bearing for the apex domain, keep it and delete the other two. | `../` | S |

**Verification:** `grep -rn '/services/' app components content` returns homepage + hire + footer + sitemap, not just sitemap; `curl localhost:3000/llms.txt` lists every 200 route; `/hire` reachable in one tap from any mobile page (footer on home, identity bar elsewhere); `npm run test:e2e` green including 1.11. *(Search Console indexing timelines are observations, not verification steps - track them, but nothing in this plan branches on them.)*

---

## Phase 2 - Proof layer (two to three weeks; the first email goes out on day one)

**Goal:** `/work` stops 404-ing **without waiting on anyone's inbox**, the "Proof" headline becomes true, and the AI positioning gets an artifact.

### 2.1 Data model - `content/data/work.ts` (M)

- `CaseStudyOutcome.source: string` (**required**). The homepage promises "every claim links to a source you can check in ten seconds"; `outcome[]` can't honour it today. Zero migration cost - nothing populates `outcome`.
- `date: string` (required, `yyyy-mm-dd`). `/work` has no sort order; also feeds 2.6.
- `body: string | string[]` - render `(Array.isArray(s.body) ? s.body : [s.body]).map(...)`. Seven sections at one paragraph each isn't a case study.
- `sections[].pre?: string` - ASCII architecture diagrams. **`app/work/[slug]/page.tsx:84-89` renders sections with no `.prose-post` wrapper, so `globals.css:161` never applies** - a bare `<pre>` gets UA `white-space: pre` with no `overflow-x` and reintroduces Phase 0.1's overflow on `/work/[slug]`. Either wrap the section body in `.prose-post` or put `overflow-x:auto` on the element inline. Non-optional, not a detail.
- `testimonial?` - same shape as `profile.testimonials` so one renderer serves both.
- **Delete `query: string`** - required field, zero consumers repo-wide.

**Required fields break `next build`, not `npm test`.** Adding `date`/`source` as required fails typecheck at the `budgetgen` literal in `content/data/work.ts` **and** the inline fixture at `tests/unit/work.test.ts:22-31`. Vitest doesn't typecheck, so `npm test` stays green while the build fails. Update both literals in the same commit; drop the `query` line at `work.test.ts:26` while there.

Render changes (`app/work/[slug]/page.tsx`): source line under each stat, array bodies, `pre` blocks, testimonial block copied from `app/page.tsx:165-174`, and an `← all work` back-link (the study is currently a leaf whose only exit is `/#contact`). Index gets `sort((a,b) => b.date.localeCompare(a.date))`.

Two tests - the honesty invariant `profile.ts:71`'s `E4` comment asserts in prose and nothing enforces:

```ts
it("every published study's numbers are sourced and dated", () => { ... });
it("client studies carry at least one sourced number", () => { ... });
```

### 2.2 Case studies - ordered so `/work` goes live with zero external dependency

| # | Slug | Source material | Blocker | Effort |
|---|---|---|---|---|
| 1 | `askaditya-terminal-assistant` | `app/api/chat/route.ts`, `lib/{prompt,cost,ratelimit}.ts`, `components/Terminal.tsx` | none | L |
| 2 | `shipping-a-claims-lens` | `../scripts/text-hygiene.mjs`, `ops/voice.md`, the 2026-07-25 audit closed in `b53b08d`, Phase 0.6/0.7 | none | M |
| 3 | `legacy-laravel-rescue` (RO, `r-o.com`) | `profile.ts:167-172` - Laravel 5.1→6.x, Mapbox, Azure AD SSO | client email | M |
| 4 | `ach-payments-livewire` (JPI, `apps.jpi.com`) | `profile.ts:173-178` - Laravel 8 + Livewire + Dwolla ACH | client email | M |
| 5 | `docusign-airway-bills` (AWB) | `profile.ts:179-184` - CodeIgniter + DocuSign | client email | M |
| 6 | `razorpay-storefront` (Mitadass) | `profile.ts:185-190` | client email | M |
| 7 | `remax-millennium-portal` | `profile.ts:141` - named once, doing zero work | client email; thinnest brief | M |

**Studies #1 and #2 are both own-work, so `MIN_STUDIES = 2` clears on your own schedule.** The original plan made #2 a client study, which outsourced `/work` going live - and with it 4.1's "restore named-clients wording", the `/services/*` proof paragraph, the metric strip swap, and 1.2's footer link - to someone else's inbox.

**Study #1** closes the biggest gap: the site sells AI integration on three pages and its sole case study is a non-AI Laravel CRUD app. Every number is hardcoded and checkable - 300-char input cap, 500-token output ceiling, 10 msg/hr/IP, $10/mo breaker, Haiku 4.5 list pricing in `lib/cost.ts`. "What broke" writes itself: the OG-image route that would have been an unauthenticated CPU-amplification endpoint until it was made to 404; the repo-less study that wrote `- undefined` into the cached corpus, now guarded at `prompt.ts:34` and tested; and the prompt-cache defect from Phase 0.5, written up as "here's what I found auditing my own system" **after** the fix commits.

**Study #2** is the phrase lens: a plausible client figure inside a `(e.g.)` placeholder in a voice file got lifted verbatim into two channel drafts as a true client story; the fix was a lens whose blocking patterns are the audit record and whose own test file is exempt from it. That's a governance story with a public artifact, no NDA, and it doubles as the credibility spine for the price-band and case-study copy that follows.

**Timeline honesty:** study #1 alone is a week at 700-1100 words with a real "What broke" section. #1 + #2 + the data-model change is two to three weeks, not one.

### 2.3 The permission email - five copies on day one (S)

> I'm writing up the [project] build as a technical case study for my site - architecture, decisions, what broke. Two questions: (1) may I name [Company], or should I write it as "a logistics company"? (2) can I quote any figures you have - volume, turnaround, cost saved? I'll send you the draft before anything goes live.

`client: "Client A"` is supported, so "no" on Q1 doesn't block. **A "yes" on Q2 is not enough on its own:** the figure must be written into `ops/voice.md`'s "Numbers I can cite" with its exact caveat, or `../scripts/text-hygiene.mjs` blocks it as an `unpermissioned-claim` regardless of the client's permission. Add that step to the workflow, not just the email. A "no" on Q2 means the study ships with `outcome` empty and numbers hedged in prose - and 2.1's test will refuse to publish it with `client` set. Correct behaviour.

### 2.4 Case-study template (S - a checklist, not code)

Seven headings, fixed order: `The problem` → `The constraints` → `The architecture` (ASCII `pre`) → `Decisions that mattered` (each naming the option *not* taken) → `The numbers` (from `outcome[]`, every value sourced) → `What broke` (**mandatory** - the section no agency writes and the one a technical buyer scans for) → `The outcome`. 700-1100 words; BudgetGen is ~330 and reads thin. Run `node ../scripts/text-hygiene.mjs --phrases content/data/work.ts` before commit - client studies 3-7 will trip `(we|I) (reduced|cut|saved|shaved|halved|slashed) ... (client|customer)` and `a client (messaged|emailed|...) me ... weeks`, which are hard blocks.

### 2.5 Wiring in the same files (S each, except where noted)

- `app/cv/page.tsx:95` renders `<strong>{p.title}</strong>` and discards `p.href`. Four live client URLs, unclickable. Wrap in an anchor.
- `lib/prompt.ts:71` feeds only `featuredWork.links` to the chat corpus, so `profile.projects` is invisible to the bot. Add a `## Client projects` block (~200 tokens against a 15-25k budget).
- **`profile.featuredWork.links` rewrite (`profile.ts:73-85`) → the four named client systems (M, gated).** One edit repairs four surfaces: home right rail, `/hire` proof list, terminal `work` command, and the bot corpus - which currently tells prospects the proof is a GitHub repo-list URL. **This is named-client attribution and carries the same permission exposure as the case studies**, so it waits on 2.3 like they do. Note the same four URLs are *already* public in `profile.projects` on `/cv`: resolve that inconsistency once - either both surfaces are fine (and the case-study gate is about *outcome claims*, not names) or `/cv` needs the same permission. Decide before either edit. Keep `metric: null` and keep the H2 "Proof: systems that run businesses" (asserted verbatim at `tests/e2e/home.spec.ts:24`).
- Metric strip: `{ value: "1", label: "Laravel + AI series" }` at 48px next to `8.3k+` reads as padding. Replace with `{ value: "2", label: "case studies", href: "/work" }` once #1 and #2 land. Do **not** derive from `getAllPosts().length` - only 3 of 4 posts are series posts and `tests/unit/content.test.ts:11` pins the array at 4.
- `profile.verify` (`profile.ts:89`) is three entries pointing at GitHub / Dev.to / LinkedIn. After #1 and #2 publish, the site's dedicated "verify me yourself" section still cites a contribution graph. Add the two case studies.
- **Regenerate the CV PDF.** `public/Aditya-Kumar-CV.pdf` is a committed binary built from `profile.ts` by `npm run cv:pdf` (`scripts/build-cv-pdf.mjs`), linked from `/cv`, with no test. Any commit touching `profile.ts` (here and in Phase 7) runs `npm run cv:pdf` and commits the result, or the download drifts from the page above it.

**Verification:** `/work` returns 200 after study #2 with no external dependency; `next build` passes with the new required fields; `npm test` enforces sourced numbers; `/work/[slug]` `scrollWidth === clientWidth` at 390px with a `pre` block present; the terminal answers "what client work has he done?" with named systems and URLs; `git diff --stat` shows the PDF regenerated alongside every `profile.ts` change.

---

## Phase 3 - Editorial engine (12 posts, Aug 2026 → Jan 2027)

**Goal:** two posts a month, forever. The launch pattern was four posts across three days then silence; the blog is stale today against a "Field notes" cadence promise.

**Hard prerequisites:** Phase 0.1 (mobile overflow) and Phase 0.6/0.7 (a lens that can fail) ship before post 1. Nine of twelve are code-heavy; optionally add a rehype highlighter in the same pass - `pre code` has zero syntax highlighting in either theme.

### The calendar

Fortnightly, 1st and 15th, matching the existing launchd reminder and `/draft-devto-post`'s framing. Stack rotation enforced - no two same-stack posts adjacent, one buyer-track post per month.

| # | Date | Slug | Track | Why this one, here |
|---|---|---|---|---|
| 1 | Aug 1 | `queue-based-ai-workflows-in-laravel-jobs-retries-and-cost-control` | Laravel | **The only broken promise on the site.** `building-ai-agents-in-php-tool-calling-with-laravel.mdx:200` names this exact title in published indexed copy. Pattern is already in production. |
| 2 | Aug 15 | `what-an-ai-chatbot-actually-costs-to-build-and-run` | Founder | **BOFU.** Puts the `$2,000-$8,000` band on an indexable page instead of inside a collapsed `<details>`. Cite the allowlisted figure with its exact caveat: *under a cent per resolved support conversation - model inference only.* `$2,000-$8,000` passes the lens (the round-number regex requires `%`); any `10-15%`-shaped range does not. |
| 3 | Sep 1 | `rate-limiting-and-spend-caps-for-ai-routes-in-nextjs` | Node | First proof of any kind for `/services/nodejs-ai-development`. Worked example is `app/api/chat/route.ts`, including the adversarial-review comments still in `lib/ratelimit.ts:20-24`. Ships alongside case study #1. |
| 4 | Sep 15 | `prompt-caching-what-it-actually-saves` | Laravel | The Phase 0.5 defect, with file and line numbers and the diff. Write it *after* the fix commits and the `cacheReadInputTokens` number is real. |
| 5 | Oct 1 | `llm-eval-harness-python` (+ public repo `llm-evals`) | Python | `/services/python-ai-development` has zero Python evidence in the repo. A 200-line harness whose fixture set is this site's live public system prompt, so every number is reproducible. |
| 6 | Oct 15 | `dont-build-an-ai-chatbot` | Founder | Opens on `ops/voice.md`'s *"sometimes the honest answer is a queue and a cron job, not a model."* An AI engineer publishing five reasons not to hire him for AI. |
| 7 | Nov 1 | `streaming-ai-in-nextjs-with-the-vercel-ai-sdk` | Node | The Node twin of the published Laravel SSE post. Same engineer, two runtimes, one opinion - that comparison is the differentiator and the internal link. |
| 8 | Nov 15 | `testing-ai-features-in-laravel` | Laravel | Backed by tests that exist here: the golden-file prompt test and `tests/unit/chat-route.test.ts` (400/422/429/503-unconfigured/503-budget/mid-stream-failure). Almost nobody writes this. |
| 9 | Dec 1 | `fastapi-celery-llm-jobs` (+ repo `fastapi-llm-jobs`) | Python | Deliberately the same engineering argument as post 1 in a second runtime, stated as such. "Range" proven with a repo instead of a fabricated client story. |
| 10 | Dec 15 | `what-an-ai-integration-audit-finds` | Founder | **BOFU.** Makes the only productized offer visible outside three service pages. Anti-sell is verbatim existing copy: *"If the honest answer is 'AI doesn't help here,' you'll get that in writing instead."* Links to the post resolved in 0.7. |
| 11 | Jan 1 | `cutting-llm-costs-in-production-laravel` | Laravel | Five levers, all from one running endpoint with public source. Ends on the ceiling, not a win - in-memory counters are per-lambda, so the cap is `$10 × instances`. |
| 12 | Jan 15 | `offline-first-ai-widget` | Node | The widget answers ten commands with no model at all; AI is the fallback, not the feature. The "hire someone who thinks about failure" post. |

Effort: **M each** (600-1200 words). Posts 5 and 9 are **L** - each ships a public MIT repo.

### Also in this phase

- **Distribution, currently zero beyond Dev.to (M).** `/api/subscribe` is a live Buttondown proxy and `NewsletterForm` ships on `/blog`, every post and all three service pages - and the plan never sent a single post to that list. Turn on Buttondown's RSS-to-email against `/blog/rss.xml` (which 1.6 makes discoverable and otherwise goes unused). Separately, `../.github/workflows/blog-posts.yml` fills the profile README from the **Dev.to feed only**, so site-first canonical posts never surface there - point it at `/blog/rss.xml` or merge both feeds.
- **Repatriate series part 1 (S).** The oldest post opens by sending readers to Dev.to. Import as `content/posts/adding-an-ai-chatbot-to-your-laravel-app-with-the-openai-api.mdx` with `canonical: "https://dev.to/adityakdevin/..."` - exactly the case the `canonical` field was built for, and `app/sitemap.ts:17` already excludes canonicalised posts.
- **Fix the dead teases (S).** `streaming-....mdx`'s "Next up: RAG in Laravel" and `rag-....mdx`'s "in part 4 we'll build AI agents" are prose with no links. Make them links. Change the absolute `https://adityadev.in/blog/...` at `rag-....mdx:9` to relative.
- **Series continuity is prose prev/next only.** No `series`/`part` frontmatter until there's UI to render it.

### Linking rules - mechanical, every post

1. One service-page link matched to the stack (Laravel → laravel, Node → nodejs, Python → python, Founder → `/hire` plus the relevant service page).
2. One backward link to a prior post, relative path.
3. One proof link: `/work/budgetgen` today, `/work/askaditya-terminal-assistant` after Phase 2.
4. One `/#contact` CTA and one booking link carrying `?ref=<slug>`, matching `app/blog/[slug]/page.tsx:76`.

### Per-post ritual

Canonical MDX → deploy → verify 200 → `/draft-devto-post` with `canonical_url` → `/post` for the social pack → **`node ../scripts/text-hygiene.mjs --phrases content/posts/<slug>.mdx`** before commit. The old ritual's bare `--phrases` with no path scans zero files and exits 0 (`0 file(s) scanned, clean.`) - every post would have shipped through a gate that cannot fail. Watch for hard blocks in service-adjacent copy: `robust`, `seamless`, `leverage`, `unlock`, `crucial`, `delve`. "Robust" is the default word for a post about production hardening.

**Verification:** 12 published by Jan 15; zero "next post" teases that aren't links; every post carries all four link types; `--phrases` run with a path on every post, exit 0; each post appears in a Buttondown send and on the profile README; `?ref=<slug>` events in GA4 (conditional on 0.12).

---

## Phase 4 - Service pages: consolidate first, then fix and deepen (M-L)

**Order matters and it changed.** The original sequence had 4.1, 4.2 and 6.1 each editing three service files that 4.3 then deletes - three copies of every edit. Refactor first, then apply each change once to the data file.

| # | Task | Effort |
|---|---|---|
| 4.1 | **Collapse three page files into `content/data/services.ts` + `app/services/[slug]/page.tsx`.** Same URLs via `generateStaticParams`, no redirects, ~250 fewer lines, per-stack depth becomes a data edit. **Pure refactor: copy verbatim, zero wording changes.** Shared constants (`PROCESS`, `AUDIT_DELIVERABLES`, `ENGAGEMENTS`) defined once. | L |
| 4.2 | **Fix the false claim** (now one edit, not three). All three pages say "Case studies with named clients and real numbers live on the work page" and link to `/work/budgetgen` - a solo Laravel CRUD app with no client, no numbers, no AI. Rewrite to what the destination delivers: *"Read the [BudgetGen build breakdown](/work/budgetgen) - schema to shipped UI, decisions included."* On Node and Python also drop the "AI engineering series" pointer, which links to Laravel-only material. Restore named-clients wording only after Phase 2 studies 3-7 land. Pre-refactor line numbers: laravel:140, nodejs:138, python:138. | S |
| 4.3 | **Price band + fourth process step on `/hire`** - ~12 lines between the header and Proof: the audit paragraph plus *"Most chatbot/LLM integrations land in the $2,000-$8,000 range; the audit is one week, fixed price, quoted on the call."* Keep "What I do" - `/hire` is a standalone landing target at 0.9 and direct entrants never saw the homepage. | S |
| 4.4 | **Per-stack depth, Laravel first** (highest traffic, best evidence): a distinct wedge sentence, `goodFit`/`notFit` lists (disqualification is the cheapest trust signal available and no page has one), 5 capabilities each proof-linked to a real post or project, and a stack-specific proof section. Node's is the strongest asset in the set - *"open the `>_` in the corner and try to break it, then here's what's behind it"* - because competitors can't copy it. Run the phrase lens on `services.ts`; this is the copy most likely to reach for `robust`/`seamless`. | L |
| 4.5 | **Python: narrow, don't pad.** Repo evidence is two strings in `profile.skills`. Reposition to *"Python AI services alongside your PHP or Node app"* - boundary-and-cost-model pitch, with an explicit disqualifier ("if your whole product is Python, I'll tell you honestly on the call"). Drop to sitemap priority 0.7 until post 5 or 9 ships, then restore. | M |
| 4.6 | **`/services/ai-integration-audit`.** The only productized offer, named on three pages, and `ai-automation-that-pays-for-itself.mdx:99` currently dumps high-intent readers on `/#contact`. Stack-neutral so it takes the head term without cannibalizing. Retarget that MDX link here. Ships with post 10. | M |
| 4.7 | `app/services/[slug]/opengraph-image.tsx` - ~14 lines against `lib/og.tsx`. Today all three highest-priority SEO pages fall back to the generic root card. Also covers the audit page for free. | S |

**Verification of 4.1, named explicitly:** before the refactor, `for p in laravel-ai-development nodejs-ai-development python-ai-development; do curl -s localhost:3000/services/$p > /tmp/before-$p.html; done`; after, same into `/tmp/after-$p.html`; `diff` each pair - empty output or the refactor isn't pure. Then `tests/unit/services.test.ts` asserts every `/blog/` proof href resolves to a real slug (the exact bug class that produced 4.2) and that `generateStaticParams()` returns the three legacy slugs.

---

## Phase 5 - Accessibility and interaction (half a day, real bugs only)

| # | Task | Files | Effort |
|---|---|---|---|
| 5.1 | Terminal transcript announces nothing. Add `role="log"` **alone** to the scroll container - `aria-live="polite"` and `aria-relevant="additions"` are its implicit values. Then `{line.cursor ? <span aria-hidden>{line.text}</span> : line.text}`: while streaming, text is hidden so per-chunk mutations are silent; the final `replaceStreamLine` drops `cursor`, swapping the hidden span for a real text node - announced exactly once. Command output and errors carry no `cursor`, so they announce immediately. | `components/Terminal.tsx:262,272` | S |
| 5.2 | Contact form blocks submit with no announcement and no focus move, and it's `noValidate` so the browser's own announcement is suppressed. Add `role="alert"` to the three error paragraphs (`:118`, `:139`, `:162`) **and** move focus to the first invalid field before the early return - both, not either. On an empty submit three alerts fire at once; the focus move makes it usable. Same on `components/NewsletterForm.tsx:110`. | `components/ContactForm.tsx:39-46`, `NewsletterForm.tsx` | S |
| 5.3 | Both forms swap in a different subtree on success, unmounting the focused button. `const successRef = useRef<HTMLDivElement>(null)`, render the success div with `ref` + `tabIndex={-1}`, focus it in `useEffect(..., [status])` - **not** inside the `res.ok` branch, where the panel isn't committed yet. Add `outline-none` so programmatic focus doesn't draw a stray ring. | both forms | S |
| 5.4 | Skip link, in **one** file. Don't add `id="main"` to 15 pages - wrap `{children}` in `app/layout.tsx` with `<div id="main" tabIndex={-1} className="flex flex-1 flex-col">`. `tabIndex={-1}` is required or Safari moves scroll but not focus. No `body > main` selector exists, so the wrapper is safe. | `app/layout.tsx:63-69` | S |
| 5.5 | `-webkit-tap-highlight-color: transparent` is global and only `.btn` has a replacement, so mobile tab-bar and footer taps give zero feedback until the route paints. One rule beside `.btn:active`: `@media (hover: none) { a:active { opacity: 0.7; } }`. Opacity isn't in the `a` transition list, so it snaps - which is the point. Drop `summary:active`; `<details>` already gives native toggle feedback. | `app/globals.css:77` | S |
| 5.6 | Delete `components/Reveal.tsx`, its import and two wrappers at `app/page.tsx:9,52,65`, the `settle` keyframes at `globals.css:127-129`, and the `.settle-in` reference in the reduced-motion block at `:138`. The class is added *after* paint with `animation-fill-mode: both`, so the metric strip snaps to opacity 0 then fades back in - the only entrance animation on the site reads as a flicker. The correct-pattern sibling `.type-reveal` ships its class in SSR markup. Do **not** patch with `.settle-armed { opacity: 0 }` in server HTML - with JS off the strip stays invisible forever, contradicting `Reveal.tsx:5`. | 3 files | S |

**Verification:** axe clean on `/` and `/blog/[slug]`; VoiceOver announces a terminal answer once, not per chunk; empty contact submit lands focus on the name field and reads the error; no visible flicker on the metric strip.

---

## Phase 6 - Visual consistency (half a day, last on purpose)

**Scope correction:** the original 6.1 extended the `::after` cyan bar to `.h-section`, which would have *added* a 56px bar under ~15 h2s that have none today (`/now`, `/uses`, `/hire`, `/work/[slug]`) and stripped `/hire`'s full-width `border-b` - a visual redesign, not a consistency pass. And it left the homepage `H2` component out of the edit list, landing at 24px everywhere and 30/36px on home.

| # | Task | Effort |
|---|---|---|
| 6.1 | **Size only, no bar, homepage included.** Add `.h-section { font-size: 1.5rem; font-weight: 600; }` to `globals.css` - do **not** touch the `h2-rule::after` selector. Apply `mono h-section` to: the homepage `H2` component (`app/page.tsx:20`, currently `text-3xl md:text-4xl`), the `sectionHead` const at `app/hire/page.tsx:24` (keeping its `border-b`), `app/uses/page.tsx:68`, `app/now/page.tsx:30/38/46/53`, `app/work/[slug]/page.tsx:86`, and the `text-2xl` h2s in `content/data/services.ts` after 4.1. **Keep `h2-rule` on every h1** - the 36px-title-plus-56px-bar is consistent across ten pages and is the site's signature. Leave the services offer-box h2 (a bordered callout, not a section) and `.cv-section` (print/ATS document, already special-cased). Screenshot `/`, `/hire`, `/now` before and after; the only intended delta is homepage h2s shrinking to 24px. | M |
| 6.2 | `components/Hero.tsx:158` is `max-w-5xl` inside a `max-w-7xl` band, so `$ scroll --to proof` starts 128px right of the `aditya@dev:~$ whoami` eyebrow directly above it - identical mono, size, colour. Change to `max-w-7xl`. One token. **Do not** narrow the hero grid to `max-w-5xl` - it leaves 232px for the text column, breaks the 64px h1, and risks wrapping the dotted-leader stat rows that `Hero.tsx:82` says must not wrap. | S |
| 6.3 | Optional: FAQ accordion is 208px narrower than every other homepage section. Move the constraint off the wrapper (`app/page.tsx:215`) onto the answer paragraph (`:225` → `max-w-2xl`) so card borders align while prose keeps a sane measure. **Do not** just delete `max-w-3xl` - answers would run ~113ch. Leaving as-is is defensible. | S |
| 6.4 | Blog index has one h1 and zero h2s; post titles are styled headings rendered as plain links. Match `app/work/page.tsx:51`: `<h2 className="mt-1 text-xl font-semibold"><Link className="block no-underline">{post.title}</Link></h2>`. Drop the redundant `mono` - `globals.css:55` already applies Plex Mono to h2. Style-neutral. | S |
| 6.5 | While in the OG layer (4.7): `app/cv/opengraph-image.tsx` is the remaining page with a generic card despite sitemap 0.8. ~10 lines against `lib/og.tsx`. Also confirm `app/robots.ts` and `app/manifest.ts` are current after the route changes in Phases 1 and 4. | S |

---

## Phase 7 - Copy truth pass (S, any time after Phase 0)

Four places tell visitors the shipped AI assistant isn't shipped:

- `app/privacy/page.tsx:65-67` - retitle to "The AI assistant", rewrite in present tense, and disclose the currently-undisclosed fact that requests are tagged with visitor IP as the gateway `user` field (`app/api/chat/route.ts:97`). This one is a factually wrong privacy policy about a live data flow - do it first in this phase.
- `app/now/page.tsx:49` → present tense. `:41` → drop the "next up: RAG with pgvector" tease for a post that shipped 2026-07-16, or name an actually-unshipped one.
- `app/uses/page.tsx:39` → "this site's terminal assistant."
- `components/Terminal.tsx:103` - **do not rewrite wholesale.** That string is the default arm of an error switch whose primary trigger is the deliberate 503 `reason: "unconfigured"`, where "being wired up" is accurate, and it's locked by `tests/e2e/p2-widget.spec.ts:73`. Keep the wired-up wording behind an explicit `data.reason === "unconfigured"` check and make only the catch-all generic.

In `content/data/profile.ts` (single source for home + `/hire` + llms.txt + bot prompt - **run `npm run cv:pdf` and commit the PDF with any change here**):

- Add `heroLine: "I ship production AI/LLM features into Laravel & Node apps - not demos."` next to `valueLine`, render at `components/Hero.tsx:39`, and replace the local `HIRE_WEDGE` at `app/hire/page.tsx:15` so the wedge has one source. Leave `valueLine` for llms.txt and the prompt. Same diff updates the stale comment at `hire/page.tsx:12-14` and the assertion at `tests/e2e/home.spec.ts:9`. Eyeball the wrap - 78 chars vs 40 runs to ~3 lines at `md:text-2xl` and pushes the CTAs down.
- `services[0].lines[1]` → keep the provider names (`lib/prompt.ts:23` feeds them to the bot), paraphrase rather than clone the service-page sentence: *"OpenAI & Claude APIs with rate limits, spend caps, streaming and evals - because an AI feature is judged by what happens when the API is slow, wrong, or down."*
- `services[1].claim` → replace "End-to-end web products, backend to pixels" with something no other surface already says. **Not** "One person from data model to deployed feature - no handoffs" - that's verbatim `CAPABILITIES[2].body` on all three service pages, i.e. exactly the cloning this section bans one bullet earlier. Try the ownership angle instead: *"I own the thing after it ships, not just until it merges."*
- `services[2].claim` → the enterprise-theater line is the only sentence in that block with a point of view, but promoting it to the claim requires rewriting `lines[1]`, which holds it verbatim. Do both or neither.

---

## Explicitly not doing

- **`min-w-0` on `<main>` / a global `main{min-width:0}` rule** - set live, changed nothing on a flex-col body. The fix is `w-full`.
- **A fenced-code fixture for the overflow regression.** `.prose-post pre` has `overflow-x: auto`, so it can never widen `main`; the existing 124-char inline URL in the fixture is the real repro.
- **Editing `tests/e2e/home.spec.ts:120`.** It already compares `scrollWidth > clientWidth`.
- **Generating llms.txt `## Pages` from `sitemap()`.** Pulls an fs read into a `force-static` route and makes a unit test read authored content. Six literal lines buy the same result today.
- **Narrowing the hero to `max-w-5xl`, or raising `/hire` and `/services/*` to it.** The 7xl hero and 5xl chrome never share the screen (`StickyChrome.tsx:110-118`).
- **A cyan bar under section h2s, or stripping `h2-rule` from h1s.** The h1 signature is the most consistent thing on the site.
- **SVG icon components for the theme toggle.** `◐` survives the hygiene gate and `globals.css:121` already uses `▋`.
- **44px tap targets on the 7 footer social links, or splitting the homepage contact list into rows.** 28px passes WCAG 2.5.8 AA; inline text links are covered by the 2.5.8 exception. Both triple mobile chrome height for no verified gain.
- **Swapping the mobile `work` tab for `hire`.** `/#work` is the only mobile path to proof; 1.2 + 1.3 cover `/hire` everywhere.
- **Screenshot or image fields on `CaseStudy`.** ASCII `pre` covers it, survives NDAs, costs no LCP, and diffs.
- **MDX bodies for case studies.** Splits the source of truth - `lib/prompt.ts`, `app/work/page.tsx` and JSON-LD all read structured fields.
- **A `telHref()` helper in `lib/site.ts`.** Two call sites, 30 characters.
- **A budget `<select>` on the contact form.** `app/api/contact/route.ts` reads an allowlist and drops unknown keys, so it captures nothing without a route change - and `faq.ts:12` defers quoting to the free scoping call.
- **Merging Node and Python into one page with 301s.** ~12 differentiated elements per page, two distinct commercial queries. Fix the false Proof paragraph instead.
- **A `Service` JSON-LD node on `/hire`, `FAQPage` on a page with no FAQ, or `offers` prices on the three Service nodes.** The `$2,000-$8,000` band is the *integration* range, not the audit, and the audit price is deliberately unpublished.
- **Tag archives, `/compare/*`, `llms-full.txt`, geo pages, per-industry pages.** Premature under a 4-post corpus.
- **Deleting `/now` and `/uses`.** `tests/e2e/blog.spec.ts:168-181` is a named regression test asserting they stay in the sitemap.
- **`.settle-armed` in SSR markup, `aria-live="off"` on a live-region descendant, `summary:active`.** Each breaks or duplicates something that works.
- **Search-Console-timeline "verification" ("Discovered → Indexed in 3 weeks", "ranks for its own name in 6 weeks").** Nothing in the plan branches on a miss. Track them as outcomes; the verification steps above are all runnable.
- **New dependencies.** Nothing here needs one. A rehype highlighter for Phase 3 is the only candidate, and it's optional.