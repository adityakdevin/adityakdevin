# adityadev.in — Complete Redesign Spec

**Owner:** Aditya Kumar (adityakdevin) · **Date:** 2026-07-16 · **Status:** Approved via interview + eng review (v2, findings folded)

## 1. Goal

Replace the 2020 Bootstrap template at adityadev.in with a modern, AI-oriented portfolio that:

- Positions Aditya as **Full Stack Developer + AI Engineer + Solution Architect** (Tech Lead @ MM Nova Tech, 9+ yrs, Lucknow, India)
- Ranks for **long-tail hire-intent + brand queries at launch** ("Laravel AI integration developer India", "adityakdevin", "Aditya Kumar full stack Lucknow"); competitive head terms ("hire AI engineer") become targets only after a backlink base exists — the Dev.to series and case studies are the link engine
- Gets cited by answer engines (ChatGPT, Perplexity, Google AI Overviews) — via entity-consistent content and JSON-LD, not checkbox files
- Converts visitors into **booked calls** (primary CTA: cal.com)
- Proves AI capability by *being* an AI product (terminal chatbot)

## 2. Decisions log (interview + eng review)

| Decision | Choice |
|---|---|
| Stack | **Next.js (App Router) on Vercel** — verify Hobby-tier commercial-use terms BEFORE build starts; budget for Pro ($20/mo) if required |
| Repo | **This repo, `/site` subdirectory**; Vercel root dir = `/site` + **Ignored Build Step** `git diff --quiet HEAD^ HEAD -- ./site` so bot commits (cards/blog/snake) never trigger deploys |
| Content architecture | Portfolio + **case-study pages** + **on-site blog** (SUPERSEDED 2026-07-17, decision d6ca1e10: new posts publish canonical at `/blog`, Dev.to becomes syndication with `canonical_url` back — see content-engine design doc `adityakdevin-master-design-20260717-031600.md`) |
| Newsletter | **Simple capture via Buttondown** (SUPERSEDED 2026-07-17, decision 94cbe686 — reverses the §16 "not built" row; scope: one form + `/api/subscribe` proxy, Buttondown owns opt-in/unsubscribe) |
| AI feature | **Terminal UI with AI inside** — commands offline, free text → LLM |
| Bot brain | **Claude + cached full-corpus system prompt** (entire site content ≈ 15–25k tokens, prompt-cached). RAG upgrade deferred → TODOS.md (trigger: Dev.to post #3 live + P3 stable) |
| Aesthetic | **Hybrid**: scannable modern site + terminal accents; full terminal lives in the widget |
| Theme | **Dark-first with real light mode** (`prefers-color-scheme` + toggle) |
| Case studies | **Named clients + real metrics** with **written permission** (see §13); launch proof = own work (see §5) |
| CV | **HTML `/cv` page with print-perfect CSS** (browser print = the PDF) |
| SEO target | Homepage → long-tail hire-intent + brand; case studies → one topical query each |
| AEO | JSON-LD entity graph + FAQ + /now + /uses. llms.txt = auto-generated freebie only (2026 data: crawlers ignore it — no effort beyond generation) |
| Ads/tracking | **Drop AdSense, GTM, Clarity. Keep GA4 only** (deferred load, see §9) |
| Contact info | Keep all channels (email, phone, socials) — errors fixed (§11) |
| Primary CTA | **Book a call → cal.com hosted page (link-first)**; inline embed is a P2 experiment if analytics show drop-off |
| Rate limiting / counters | **Upstash Redis** via Vercel Marketplace (`@upstash/ratelimit`) — Vercel KV is discontinued |
| Phasing | **P1a launch → P1b polish → P2 proof → P3 widget**; staged DNS cutover with rollback (§12) |
| Tests | **Full suite, written with each phase** — Vitest (unit) + Playwright (E2E) + 1 persona eval; "suite green" gates every phase |

## 3. Architecture

```
adityakdevin/adityakdevin (this repo)
├── README.md, dark_mode.svg, …      # GitHub profile (untouched)
├── .github/workflows/               # snake/cards/blog actions (force-push step REMOVED — eng review Issue 1)
├── index.html, assets/, CNAME       # OLD site — kept 7 days past cutover as rollback, then deleted
└── site/                            # NEW Next.js app (Vercel root directory)
    ├── app/
    │   ├── page.tsx                 # Home (Field notes = local posts + Dev.to legacy, merged)
    │   ├── cv/page.tsx
    │   ├── work/[slug]/page.tsx     # Case studies (P2)
    │   ├── blog/…                   # Phase 4 (2026-07-17): index + [slug] (MDX) + rss.xml
    │   ├── services/laravel-ai-development/page.tsx  # Phase 4: service-intent page
    │   ├── now/page.tsx             # P2 — carries visible "last updated"; CUT if stale >2 months
    │   ├── uses/page.tsx            # P2
    │   ├── privacy/page.tsx         # P1b — plain-language: GA4, form data, chat logging, newsletter, removal
    │   ├── api/chat/route.ts        # Claude streaming endpoint (Edge) — P3
    │   ├── api/contact/route.ts     # Form → email (Mailtrap) + D15 attribution fields
    │   └── api/subscribe/route.ts   # Phase 4: newsletter → Buttondown proxy
    ├── content/
    │   ├── data/profile.ts          # identity, roles, skills, experience, contact
    │   ├── data/faq.ts              # single source for: rendered FAQ + FAQPage JSON-LD + bot prompt
    │   ├── posts/*.mdx              # Phase 4: blog posts — EXCLUDED from the bot prompt (§6 budget)
    │   └── *.mdx                    # case studies, now, uses
    └── lib/
        ├── prompt.ts                # bot's cached system prompt from content/data/** ONLY (posts excluded — unit-tested)
        ├── jsonld.ts                # schema generators incl. Article (consume profile.ts/faq.ts/posts)
        ├── posts.ts                 # Phase 4: frontmatter loader → blog pages, sitemap, RSS, Field-notes merge
        ├── ratelimit.ts             # shared in-memory limiter (contact + subscribe; Upstash swap = one file)
        └── devto.ts                 # legacy posts fetch w/ fallback (§5.5) — merged, not sole source
```

**Data flow (single source of truth):**

```
profile.ts ──┬─→ Home hero/services     faq.ts ──┬─→ FAQ section
             ├─→ /cv                             ├─→ FAQPage JSON-LD
             ├─→ JSON-LD Person graph            └─→ bot system prompt
             ├─→ llms.txt (generated)
             └─→ bot system prompt (via lib/prompt.ts)

content/posts/*.mdx ──┬─→ /blog/[slug] (canonical) + /blog index + Field-notes merge
 (Phase 4)            ├─→ sitemap.ts, rss.xml, Article JSON-LD
                      ├─→ /draft-devto-post → Dev.to (canonical_url ↩)
                      └─X NOT the bot prompt — §6 cache budget (unit-tested exclusion)
```

Scope of the rule: structured FACTS live in profile.ts/faq.ts. Page prose, SEO copy, and case-study narrative stay in their pages/MDX — over-centralizing editorial copy produces generic text (outside-voice note, accepted).

- **Hosting:** Vercel. **Deploy hygiene:** Ignored Build Step (above); bad deploys roll back via Vercel's instant "promote previous deployment"; env-var changes are versioned in Vercel's UI.
- **DNS cutover (staged, §12):** TTL→300s at T-3 days → verify on preview domain → cut → old files kept 7 days (rollback = re-point DNS) → cleanup commit.
- **Email DNS is part of the cutover:** inventory current MX/SPF/DKIM/DMARC for adityadev.in BEFORE any DNS change; carry records over; verify domain in Resend during P1 week 1; send/receive test after cutover. A broken contact@ during launch week is the worst-case failure.

## 4. Design system (v3 — design review, all values committed)

- **Feel:** "senior engineer's terminal, professionally lit" — not CRT cosplay. Recruiter can skim in 30s; dev finds depth. Layout language: **editorial composition, not card grids** (cards only where the card IS the interaction — see §5).
- **Type (committed):** **IBM Plex Mono** (display, headings, prompts, metric numerals) + **IBM Plex Sans** (body) — one engineered family, self-hosted, terminal heritage. Never body-text-in-mono. Type scale (desktop / mobile):
  | Role | Size / weight / line-height |
  |---|---|
  | Hero name (H1) | 64px/56px · Plex Mono 600 · 1.05 |
  | Hero value line | 24px/20px · Plex Sans 400 · 1.4 |
  | Section heading (H2) | 36px/28px · Plex Mono 600 · 1.2 |
  | Sub-heading (H3) | 22px/20px · Plex Mono 500 · 1.3 |
  | Body | 17px/16px · Plex Sans 400 · 1.6 (never <16px) |
  | Caption/prompt eyebrow | 14px · Plex Mono 400 · 1.4 |
- **Spacing:** 8px base scale (8/16/24/32/48/64/96/128). Section vertical rhythm: 96px desktop / 64px mobile — deliberately varied per section, no cookie-cutter equal heights.
- **Tokens (CSS variables, both themes, required — no raw hex in components):**
  | Token | Dark (default) | Light |
  |---|---|---|
  | `--bg` | `#0d1117` | `#fafaf8` |
  | `--surface` | `#161b22` | `#ffffff` |
  | `--text` | `#e6edf3` | `#1f2328` |
  | `--muted` | `#8b949e` | `#57606a` |
  | `--accent` | `#22b8d4` (AA-checked on dark) | `#0891b2` |
  | `--border` | `#30363d` | `#d0d7de` |
  | `--focus` | `#22b8d4` 2px ring, 2px offset | `#0891b2` 2px ring, 2px offset |
- **Light-mode rule (decided):** the **hero stays dark in both themes** — one designed first screen, full stop. The light page begins at the metric strip; a designed gradient/border seam handles the dark→light transition. All other terminal blocks (code, widget) also stay dark.
- **Motion (exactly 3, nothing else moves; `prefers-reduced-motion` disables all):**
  1. Hero command-type reveal — 600ms ease-out, once per load; cursor blink 1.06s step.
  2. Metric strip settle-in — 400ms ease-out on first scroll-enter.
  3. Widget open/close — 250ms ease-in-out.
  **Scanlines: cut** (design review — texture behind text competes with type on an editorial layout).
- **Terminal accents:** `$`-prefixed section eyebrows, command-style nav hints. The prompt is a *device*, never the headline (see §5.1).
- **Interactive states (global):** hover = accent underline/arrow-shift 150ms; active = 1px translate-down; focus = `--focus` ring on ALL interactive elements; visited links keep a distinguishable tint.
- **Accessibility (acceptance criteria, not vibes):** WCAG AA contrast in BOTH themes (verified per token pair above), keyboard-navigable widget & nav, touch targets ≥44px, ASCII portrait `aria-hidden` with real alt text elsewhere.
- **Performance budget:** Lighthouse ≥ 95 all categories; LCP < 1.5s on 4G; zero layout shift. `next/image` for raster images only — SVG/ASCII assets ship as plain files. Hero text server-rendered (see §5A state matrix).

## 5. Pages & information architecture

| Route | Phase | Purpose |
|---|---|---|
| `/` | P1a | Convert: hero → proof → services → FAQ → book call |
| `/cv` | P1a | HTML CV, print-perfect |
| `/privacy` | P1b | Trust + compliance (GA4, form, chat logging) |
| `/work/[slug]` | P2 | 3 case studies, one topical query each |
| `/now`, `/uses` | P2 | AEO surface; /now carries "last updated" stamp |
| `/api/chat` | P3 | Chatbot endpoint |
| `/api/contact` | P1a | Form handler |
| 404 | P1a | `command not found` + `ls` of real pages |

**Global chrome (design review 3A):** slim **sticky header** appears after scrolling past the hero — name · nav links (`~/work`, `~/cv`, `~/now`) · compact "Book a call" button. On mobile: sticky bottom **"Book a call →" bar** instead. This is both the site nav (previously unspecified) and the persistent CTA.

**Homepage sections (in order — headings are claims, not labels; terminal `$` eyebrows decorate, never replace them):**
1. **Hero (brand-first, full-bleed, ONE composition — both themes dark):** eyebrow line types `aditya@dev:~$ whoami` (14px Plex Mono) → the *output* renders as the page's largest text: **"Aditya Kumar"** (H1) + plain-language value line **"I build Laravel & AI products that ship."** + roles line "Full Stack Developer · AI Engineer · Solution Architect — Tech Lead @ MM Nova Tech · Lucknow, India". **Anchor:** professional photo, duotone/cyan edge-light treatment so it belongs to the dark composition (photo = P1a blocker, §13.9); ASCII portrait survives as secondary texture inside the composition (`aria-hidden`, hidden <768px). Primary button "Book a call →", secondary ghost "Ask my AI ↗" (P3). Visible hint of the metric strip at the fold.
2. **Metric strip** (was "proof bar" — now one inline strip, no tile boxes): 9+ years · 60+ projects · 8k+ contributions · Laravel+AI series. Static build-time numbers, no live fetch above the fold.
3. **"I ship AI features into production apps"** (services — numbered editorial rows 01/02/03, full-width, NOT cards): AI Integration / Full Stack Delivery / Architecture & Leadership — each a claim + two lines. Non-interactive at P1a and styled as prose (no card affordance); rows gain links in P2.
4. **"Proof: systems that run businesses"** (featured work): ONE lead project as a narrative row (BudgetGen — problem → build → outcome) + two compact links (payments/integrations set, the Dev.to series). Clickable case-study cards return in P2 once written permission exists — cards only when they're truly clickable.
5. **"Verify me yourself"** (trust beat — design review 5A): externally checkable claims with live links — GitHub contribution graph, Dev.to series, live client sites, years. A designed **testimonial slot ships hidden**; the first real quote (§13.8) switches it on with no redesign.
6. **"Field notes from Laravel + AI work"** (writing): latest 3 Dev.to posts as a plain dated list (`ls -la` styling), build-time fetch + daily ISR. **Failure contract:** on error reuse last successful payload; if none, hide section entirely — never fail a build, never render empty.
7. **"Before you book"** (FAQ): 5-6 hire-intent Q&As from `content/data/faq.ts` (single source: section + schema + bot). Substantive answers only.
8. **Contact / booking:** "Book a call →" link (primary) + form (fallback) + email/phone/socials.

### 5A. Interaction state matrix (design review 4A — what the user SEES)

| Surface | Loading | Empty | Error | Success | Notes |
|---|---|---|---|---|---|
| Hero | full text server-rendered in HTML — animation is enhancement only | n/a | n/a | n/a | protects LCP, no-JS, reduced-motion in one rule |
| Metric strip | static (build-time) — never a spinner above the fold | n/a | build fails loud in CI, never at runtime | n/a | numbers updated per deploy |
| Contact form | button → "Sending…" + disabled, field lock | inline field validation on blur (specific messages, labels always visible — no placeholder-as-label) | "Couldn't send — try again or email contact@adityadev.in" (link) | inline success panel "Got it — I reply within 24h" replaces form | honeypot invisible to users |
| Writing list | build-time, none | section hidden entirely | section hidden (last-good payload first) | — | per §5.6 contract |
| Widget (P3) | streaming block cursor while tokens arrive | boot line + `help` hint | mid-stream: "…connection hiccup — try once more?" in-terminal | — | degraded mode: amber notice "AI is resting (budget cap) — commands still work" |
| Theme toggle | instant, no flash (inline script reads preference pre-paint) | — | — | — | choice persisted in localStorage |

### 5B. Responsive spec (design review 9A — intentional, not stacked)

| Section | <768px behavior |
|---|---|
| Hero | photo full-width above name-output; prompt eyebrow shrinks to 12px; ASCII portrait hidden; buttons full-width stacked |
| Sticky chrome | header collapses to name + menu; sticky bottom "Book a call →" bar (44px+ tap target) |
| Metric strip | 2×2 compact grid, numbers 28px |
| Service rows | stacked, numbered rail (01/02/03) kept left |
| Work narrative | image/terminal block above text |
| Verify/Writing/FAQ | single column, list rhythm preserved |
| Widget | full-screen takeover (already specced §6) |

All rules Playwright-asserted at 375px; zero-CLS budget applies to every breakpoint.

## 6. Terminal chatbot ("the widget") — Phase 3

- **UI:** floating `>_` button → terminal panel (full-screen on mobile). Boot line: `AskAditya v1.0 — type 'help' or just ask.`
- **Offline commands (no LLM, instant):** `help`, `whoami`, `skills`, `work`, `cv`, `contact`, `book` (opens cal.com), `source` (explains its architecture, links the series), `sudo hire-aditya` (easter egg → booking).
- **Free text → `/api/chat`:** Claude Haiku, streaming, **cached full-corpus system prompt** built by `lib/prompt.ts` from profile.ts + faq.ts + MDX (whole corpus ≈15–25k tokens; prompt caching makes this cheaper and more accurate than RAG at this size). Persona: answers only about Aditya's work; redirects hiring questions to booking.
- **Hardening (non-negotiable, all covered by tests):**
  - IP rate limit 10 msg/hr — `@upstash/ratelimit` (Upstash Redis, Vercel Marketplace)
  - 300-char input cap (client + server), 500-token response cap
  - **Spend circuit breaker:** route increments `spend:YYYY-MM` token counter in Upstash and HARD-REFUSES LLM calls past the $10-equivalent cap → widget auto-degrades to offline-commands-only with a friendly notice. Anthropic workspace budget limit stays as backstop. An alarm alone is not enforcement.
  - Mid-stream Anthropic failure → friendly in-widget message, never a frozen cursor
  - Prompt-injection posture: no tools, no secrets in context, output rendered as text only

## 7. SEO / AEO layer

- **Metadata:** per-page title/description from central config; canonicals everywhere.
- **JSON-LD:** `Person` + `ProfilePage` (home), occupation detail (cv), `CreativeWork` (work), `FAQPage` (from faq.ts), `Service` — one shared `@id` graph. Generators in `lib/jsonld.ts` consume profile.ts/faq.ts only.
- **llms.txt:** generated at build from profile.ts. Zero manual effort — 2026 measurements show AI crawlers rarely fetch it and it doesn't correlate with citations; it ships because it's free, not because it's a lever.
- **OG images:** `next/og` per page — template (design review 10A): 1200×630, `--bg` dark, prompt eyebrow (`aditya@dev:~$ <page>`), name/title in Plex Mono 600, role line in `--muted`, 4px cyan accent bar bottom, 64px safe area all sides. Known risk: custom-font loading in the OG runtime is finicky on Vercel — fallback: system mono.
- **Sitemap + robots:** standard; explicitly allow GPTBot/ClaudeBot/PerplexityBot.
- **What actually earns AEO citations:** entity consistency (same name/title/links everywhere), crawlable substantive content, and external corroboration (Dev.to series, GitHub) — the JSON-LD graph supports this; no checkbox file substitutes for it.

## 8. CV page

- Data-driven from profile.ts: summary, experience timeline, skills grouped, education, selected projects, contact.
- `@media print`: hides nav/chrome/chatbot, dark→light auto, real hyperlinks preserved. "Download PDF" button = `window.print()`.
- **Acceptance:** Chrome + Safari print output, max 2 A4 pages, no orphan headings, no clipped content; ATS-parseable (semantic HTML, standard section names, no text-in-images).

## 9. Analytics

GA4 only — loaded on first interaction or 3s idle (never in the critical path). **Remove:** GTM, Clarity, AdSense (+ its meta tag). Add Vercel Speed Insights for CWV monitoring.

## 10. Contact plumbing

- Form → `/api/contact` → Resend → contact@adityadev.in. Honeypot + rate limit (Upstash) + server-side validation. **Error contract:** Resend/API errors are logged (30-day retention, no message bodies in logs) and NEVER leaked to the client — user sees a clear retry message with the direct email as fallback.
- **Resend domain verification is a P1-week-1 task** (DNS records; see §3 email-DNS checklist) — the form cannot ship without it.
- cal.com: account + one 30-min "Intro call" event type. Launch = hosted-page link; inline embed only as a P2 experiment driven by drop-off data.

## 11. Content corrections (bugs in current site — fix regardless)

- ❌ Fake testimonials (Saul Goodman et al.) — delete; real testimonials only when collected (§13).
- ❌ Lorem ipsum skills intro, empty About text, `.` placeholders — replaced by real copy.
- ❌ Phone `+91 737664320` vs `+91 7376624320` — confirm the correct one, use once.
- ❌ Age hardcoded "25" — compute from DOB or omit.
- ❌ Email mismatch — one address: contact@adityadev.in.
- ❌ Empty favicon/manifest hrefs — real favicon set (terminal `>_` or ASCII-A monogram).
- ❌ Skype links ×2, "Photographer" typed role, "Designed by Webtechgen" credit — removed.

## 12. Phases & acceptance criteria

**Phase 1a — Launch (~1.5 weeks):** design system, Home (all sections; Featured Work = own-work cards), `/cv`, contact form (Resend verified) + cal.com link, metadata + Person/ProfilePage JSON-LD + sitemap + robots, GA4 (deferred), 404, **unit+E2E tests for everything shipped**. Staged DNS cutover: TTL lowered T-3d, preview-domain verification, cut, old site retained.
✅ Done when: Lighthouse ≥95×4 + WCAG AA checks pass, form + booking verified end-to-end (test email + test booking), suite green, DNS cut with rollback intact, email send/receive verified post-cutover.

**Phase 1b — Polish (days, same cadence):** OG images, llms.txt, FAQ section + FAQPage schema, `/privacy`, remaining schema graph. Old-site files deleted after 7 stable days.
✅ Done when: rich-results test passes, /privacy linked in footer, cleanup commit merged.

**Phase 2 — Proof (~2 weeks after):** 3 case studies (named + metrics, written permission on file), `/now` (+ stamp), `/uses`, homepage client cards + service-card links wired, embed-vs-link booking experiment if data warrants.
✅ Done when: each case study passes rich-results and is indexed in GSC, suite green.

**Phase 3 — The widget (~2 weeks after):** terminal chatbot, offline commands, Claude + cached-corpus prompt, Upstash rate limit + spend circuit breaker, persona eval.
✅ Done when: rate limit + spend cap verified BY TESTS, degraded mode works, mid-stream failure handled, mobile verified, `source` command links the live series.

## 13. Inputs needed from Aditya (blockers, gather during P1)

1. Correct phone number.
2. **Written** client permission (email approval suffices, but on file) + publishable metrics: Remax Millennium, MM Nova Tech projects, AI client work.
3. cal.com account + event type.
4. Resend account + **domain DNS verification** (week 1).
5. **Current DNS inventory** — all records for adityadev.in (A/CNAME/MX/SPF/DKIM/DMARC) before anything changes; where is email hosted today?
6. **Vercel plan check** — confirm Hobby-tier terms permit commercial lead-gen use, or budget Pro.
7. Anthropic API key (P3) + $10/mo ceiling confirmed.
8. 2-4 real testimonials (ask NOW — takes weeks).
9. Professional photo.
10. GSC access for cutover monitoring.

## 14. Risks & tradeoffs (accepted, eyes open)

- **Monorepo `/site`:** accepted; boundary enforced by Ignored Build Step.
- **Named clients + metrics:** requires written permission; fallback = named project, qualitative outcome.
- **Public phone number:** WILL attract spam/scraper calls — accepted deliberately for local-client conversion; honeypot protects only the form, nothing protects the phone. Revisit if spam volume hurts.
- ~~**Blog off-site (Dev.to)**~~ — risk retired 2026-07-17: blog moved on-site (decision d6ca1e10). The replacement risk: content is now a build+writing commitment; the month-6+ kill checkpoint in CONTENT_PLAN.md owns it.
- **GA4:** familiarity wins; revisit if EU consent UX becomes annoying.
- **Link-first booking:** context switch at CTA accepted in exchange for zero third-party weight at launch; embed revisited with P2 data.
- **Terminal aesthetic:** deliberately hybrid so non-technical buyers get a scannable site; if bounce data says otherwise, accents dial down — brand serves conversion, not vice versa.

## 15. Test plan (summary — full artifact: `~/.gstack/projects/adityakdevin-adityakdevin/adityakdevin-master-eng-review-test-plan-20260716-134143.md`)

24 mapped paths: `/api/chat` guardrail branches (rate limit, input cap, spend cap, mid-stream failure, injection persona [→EVAL]), `/api/contact` (validation, honeypot, Resend-down), lib generators (prompt, JSON-LD schema-validity, llms.txt), Dev.to fallback, and 7 E2E flows (booking, form, widget offline/online/degraded, CV print, theme). Framework: Vitest + Playwright + 1 persona eval. Every phase's acceptance includes "suite green".

## 16. NOT in scope (considered, explicitly deferred)

- **RAG pipeline** — deferred to TODOS.md; cached full-corpus prompt is the launch architecture (corpus ≈15–25k tokens; caching beats retrieval at this size).
- ~~**On-site blog**~~ — SUPERSEDED 2026-07-17 (decision d6ca1e10): `/blog` built as additive Phase 4; new posts site-first canonical, Dev.to syndicated with `canonical_url`. Rationale + full scope: content-engine design doc.
- **Inline cal.com embed** — P2 experiment, not launch scope.
- **Anchor-URL redirects** — cut; hash fragments never reach the server, nothing to 301.
- **WhatsApp CTA, dark-mode-only art directions** — not requested, not built. (~~newsletters~~ — SUPERSEDED 2026-07-17, decision 94cbe686: simple Buttondown capture ships with the blog phase.)
- **Competitive head-term SEO campaign** — out of scope until backlink base exists (see §1).

## 17. What already exists (reused, not rebuilt)

- **gh-ascii SVG assets** (dark_mode.svg) → hero decoration.
- **Dev.to integration pattern** — blog-post workflow + API usage already proven in this repo; lib/devto.ts reuses the same public API.
- **Profile content** — GitHub README positioning copy seeds profile.ts; the two stay consistent (same entity, AEO win).
- **Existing GitHub Actions** — untouched except the removed force-push step (Issue 1, applied).
- **Dev.to series** — is the AI-authority engine; the site links it rather than duplicating it.

## 18. Failure modes (new codepaths × production reality)

| Codepath | Realistic failure | Test? | Handled? | User sees |
|---|---|---|---|---|
| /api/chat stream | Anthropic 5xx mid-stream | ✅ planned | ✅ friendly message | clear error, not frozen cursor |
| /api/chat spend gate | counter race at cap boundary | ✅ planned | ✅ hard refuse ± one request | degraded-mode notice |
| /api/chat rate limit | IP rotation abuse | ✅ planned | ✅ spend gate is the backstop | normal service |
| /api/contact | Resend outage | ✅ planned | ✅ error contract §10 | retry message + direct email |
| Dev.to fetch | API down at ISR | ✅ planned | ✅ last-good payload / hide | day-old posts or no section |
| DNS cutover | propagation split-brain | manual checklist | ✅ both sites live during window | correct site either way |
| Email DNS | MX dropped in cutover | manual checklist | ✅ inventory-first (§3) | mail keeps flowing |
| OG generation | font fails in og runtime | ✅ planned (snapshot) | ✅ system-font fallback | slightly plainer card |

No silent critical gaps remain: **0 critical gaps** (every failure mode has a test or checklist + handling + visible user outcome).

## 19. Worktree parallelization

| Step | Modules touched | Depends on |
|---|---|---|
| Design system + layout | site/app (layout, globals), site/components | — |
| Content layer | site/content, site/lib (jsonld, prompt, devto) | — |
| Pages (home, cv, 404) | site/app | design system, content layer |
| Contact plumbing | site/app/api/contact, Resend/DNS setup | — |
| SEO/OG/sitemap | site/app (metadata), site/lib | content layer |
| Widget (P3) | site/components/terminal, site/app/api/chat | content layer |

Lanes: **A:** design system → pages (sequential, shared site/app) · **B:** content layer (independent) · **C:** contact plumbing (independent). Launch A+B+C in parallel worktrees; merge; then SEO/OG. P3 widget is its own later lane. ⚠️ A and SEO both touch site/app metadata — run SEO after A merges.

## Implementation Tasks
Synthesized from this review's findings. Each task derives from a specific finding above. Run with Claude Code or Codex; checkbox as you ship.

- [x] **T1 (P1, human: ~5min / CC: ~1min)** — .github/workflows/main.yml — delete force-push-to-master step
  - Surfaced by: Architecture Issue 1 — force:true race can destroy commits
  - Files: .github/workflows/main.yml — **applied during this review**
  - Verify: next scheduled snake run still updates output branch
- [ ] **T2 (P1, human: ~10min / CC: ~2min)** — Vercel project config — Ignored Build Step `git diff --quiet HEAD^ HEAD -- ./site`
  - Surfaced by: Architecture Issue 2 — bot commits trigger deploys
  - Verify: push a README-only commit → no deploy
- [ ] **T3 (P1, human: ~2h / CC: ~10min)** — site/app/api/chat — Upstash monthly spend counter + hard gate + degraded mode
  - Surfaced by: Architecture Issue 3 + outside voice — alarm ≠ enforcement
  - Verify: unit test forces counter past cap → route refuses, widget degrades
- [ ] **T4 (P1, human: ~1h / CC: ~10min)** — DNS — staged cutover + email-DNS inventory checklist executed
  - Surfaced by: Architecture Issue 4 + outside voice T2
  - Verify: mail send/receive test post-cutover; rollback re-point rehearsed
- [ ] **T5 (P2, human: ~30min / CC: ~3min)** — site/content/data/faq.ts — single-source FAQ feeding section + schema + bot
  - Surfaced by: Code Quality Issue 5
  - Verify: unit test asserts all three consumers render identical answers
- [ ] **T6 (P2, human: ~1h / CC: ~5min)** — site/lib/devto.ts — fallback contract (last-good / hide, never fail build)
  - Surfaced by: Code Quality Issue 6
  - Verify: unit test with mocked fetch failure → build value returned
- [ ] **T7 (P1, human: ~4d / CC: ~3 sessions)** — site/** — full Vitest+Playwright+eval suite per §15
  - Surfaced by: Test review Issue 7 — 0/24 paths covered
  - Verify: CI green gate on every phase
- [ ] **T8 (P2, human: ~2h / CC: ~10min)** — site/app — link-first booking CTA + deferred GA4 load
  - Surfaced by: Performance Issue 8 + outside voice T4
  - Verify: Lighthouse ≥95 on 4G-throttled run
- [ ] **T9 (P2, human: ~1 evening / CC: ~10min)** — site/app/privacy — privacy page per outside voice T5
  - Verify: linked in footer, covers GA4/form/chat logging
- [ ] **T10 (P1, human: ~15min / CC: n/a)** — Vercel — confirm Hobby-tier commercial-use terms or budget Pro
  - Surfaced by: outside voice T6 note 7
  - Verify: written note in §13 answered

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | — |
| Codex Review | `/codex review` | Independent 2nd opinion | 2 | CLEAR (outside voices ×2) | eng: 30 pts → 6 decisions · design: 7 findings, litmus 5/7 FAIL → all fixed |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | CLEAR (PLAN) | 8 issues + 24 test gaps → all folded, 0 critical gaps |
| Design Review | `/plan-design-review` | UI/UX gaps | 1 | CLEAR (FULL) | score: 6/10 → 9/10, 10 decisions, 0 unresolved |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | — |

- **CODEX:** design pass (GPT-5.5): classified HYBRID; flagged weak brand-first hero, card creep, generic headlines, decorative motion, unlocked tokens — all resolved (Issues 1–10).
- **CROSS-MODEL:** Codex + independent Claude design subagent CONFIRMED-failed litmus checks 1/2/3/5/6 (brand, anchor, scannability, cards, motion); all five repaired: name-as-output hero + photo anchor, claim headings, editorial recomposition, 3 pinned motions (scanlines cut). One disagreement (premium-without-shadows) mooted by the flat token system.
- **DESIGN DECISIONS (10):** name-as-output hero · photo-in-composition anchor · claim-shaped headings · sticky header + mobile CTA bar · full interaction state matrix · verifiable-proof trust section + hidden testimonial slot · editorial recomposition (cards only when clickable) · IBM Plex Mono+Sans + full token/type/spacing system · hero stays dark in light mode · pinned motion values + OG template, scanlines cut.
- **VERDICT:** ENG + DESIGN CLEARED — ready to implement (P1a). Mockup pass deferred to TODOS (designer needs OpenAI key).

NO UNRESOLVED DECISIONS
