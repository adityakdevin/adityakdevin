# adityadev.in — Complete Redesign Spec

**Owner:** Aditya Kumar (adityakdevin) · **Date:** 2026-07-16 · **Status:** Approved via interview + eng review (v2, findings folded)

## 1. Goal

Replace the 2020 Bootstrap template at adityadev.in with a modern, AI-oriented portfolio that:

- Positions Aditya as **Full Stack Developer + AI Engineer + Solution Architect** (Tech Lead @ MM Novatech, 7+ yrs, Lucknow, India)
- Ranks for **long-tail hire-intent + brand queries at launch** ("Laravel AI integration developer India", "adityakdevin", "Aditya Kumar full stack Lucknow"); competitive head terms ("hire AI engineer") become targets only after a backlink base exists — the Dev.to series and case studies are the link engine
- Gets cited by answer engines (ChatGPT, Perplexity, Google AI Overviews) — via entity-consistent content and JSON-LD, not checkbox files
- Converts visitors into **booked calls** (primary CTA: cal.com)
- Proves AI capability by *being* an AI product (terminal chatbot)

## 2. Decisions log (interview + eng review)

| Decision | Choice |
|---|---|
| Stack | **Next.js (App Router) on Vercel** — verify Hobby-tier commercial-use terms BEFORE build starts; budget for Pro ($20/mo) if required |
| Repo | **This repo, `/site` subdirectory**; Vercel root dir = `/site` + **Ignored Build Step** `git diff --quiet HEAD^ HEAD -- ./site` so bot commits (cards/blog/snake) never trigger deploys |
| Content architecture | Portfolio + **case-study pages**; blog stays Dev.to-first |
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
    │   ├── page.tsx                 # Home
    │   ├── cv/page.tsx
    │   ├── work/[slug]/page.tsx     # Case studies (P2)
    │   ├── now/page.tsx             # P2 — carries visible "last updated"; CUT if stale >2 months
    │   ├── uses/page.tsx            # P2
    │   ├── privacy/page.tsx         # P1b — plain-language: GA4, form data, chat logging, removal contact
    │   ├── api/chat/route.ts        # Claude streaming endpoint (Edge) — P3
    │   └── api/contact/route.ts     # Form → email (Resend)
    ├── content/
    │   ├── data/profile.ts          # identity, roles, skills, experience, contact
    │   ├── data/faq.ts              # single source for: rendered FAQ + FAQPage JSON-LD + bot prompt
    │   └── *.mdx                    # case studies, now, uses
    └── lib/
        ├── prompt.ts                # builds the bot's cached system prompt from content/** at build time
        ├── jsonld.ts                # schema generators (all consume profile.ts/faq.ts)
        └── devto.ts                 # posts fetch w/ fallback (§5.5)
```

**Data flow (single source of truth):**

```
profile.ts ──┬─→ Home hero/services     faq.ts ──┬─→ FAQ section
             ├─→ /cv                             ├─→ FAQPage JSON-LD
             ├─→ JSON-LD Person graph            └─→ bot system prompt
             ├─→ llms.txt (generated)
             └─→ bot system prompt (via lib/prompt.ts)
```

Scope of the rule: structured FACTS live in profile.ts/faq.ts. Page prose, SEO copy, and case-study narrative stay in their pages/MDX — over-centralizing editorial copy produces generic text (outside-voice note, accepted).

- **Hosting:** Vercel. **Deploy hygiene:** Ignored Build Step (above); bad deploys roll back via Vercel's instant "promote previous deployment"; env-var changes are versioned in Vercel's UI.
- **DNS cutover (staged, §12):** TTL→300s at T-3 days → verify on preview domain → cut → old files kept 7 days (rollback = re-point DNS) → cleanup commit.
- **Email DNS is part of the cutover:** inventory current MX/SPF/DKIM/DMARC for adityadev.in BEFORE any DNS change; carry records over; verify domain in Resend during P1 week 1; send/receive test after cutover. A broken contact@ during launch week is the worst-case failure.

## 4. Design system

- **Feel:** "senior engineer's terminal, professionally lit" — not CRT cosplay. Recruiter can skim in 30s; dev finds depth.
- **Type:** monospace display font for headings/prompts, humanist sans for body. Never body-text-in-mono.
- **Dark (default):** near-black `#0d1117`-family bg, cyan `#0891b2` accent, warm white text. **Light:** true designed light theme; terminal blocks stay dark in both.
- **Terminal accents:** `$`-prefixed section headers, blinking cursor in hero, command-style nav hints, subtle scanline texture on hero only. One restrained entrance animation max; `prefers-reduced-motion` fully respected (cursor blink + scanlines off).
- **Accessibility (acceptance criteria, not vibes):** WCAG AA contrast in BOTH themes (cyan-on-dark verified), keyboard-navigable widget & nav, focus states visible, ASCII portrait `aria-hidden` with real alt text elsewhere.
- **Performance budget:** Lighthouse ≥ 95 all categories; LCP < 1.5s on 4G; zero layout shift. `next/image` for raster images only — SVG/ASCII assets ship as plain files.

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

**Homepage sections (in order):**
1. **Hero** — `aditya@dev:~$ whoami` → typed: "Full Stack Developer · AI Engineer · Solution Architect". Sub-line: 7+ yrs / Tech Lead @ MM Novatech / Lucknow, India. Primary button **"Book a call →"** (cal.com hosted page, styled prominent link — no embed at launch), secondary "Ask my AI ↗" (P3). ASCII-art portrait as decoration (`aria-hidden`).
2. **Proof bar** — 4 stat tiles: years, projects shipped, GitHub contributions, Dev.to series.
3. **What I do** — 3 service cards: AI Integration / Full Stack Delivery / Architecture & Leadership.
4. **Featured work (P1a = own work, zero permission risk):** BudgetGen, payments & integrations set, the Laravel+AI Dev.to series. Client cards with names + metrics REPLACE these in P2, only once written permission exists.
5. **Writing** — latest 3 Dev.to posts, build-time fetch + daily ISR. **Failure contract:** fetch wrapped, on error reuse last successful payload; if none, hide section entirely. A Dev.to outage must never fail a build or render an empty section.
6. **FAQ** — 5-6 hire-intent Q&As from `content/data/faq.ts` (single source: section + schema + bot). Substantive answers — thin/promotional FAQ schema can backfire (rich-result eligibility is Google's call, never a core outcome).
7. **Contact / booking** — "Book a call →" link (primary) + form (fallback) + email/phone/socials.

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
- **OG images:** `next/og` per page, terminal-styled. Known risk: custom-font loading in the OG runtime is finicky on Vercel — budget a fallback (system mono) if the font path fights back.
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
2. **Written** client permission (email approval suffices, but on file) + publishable metrics: Remax Millennium, MM Novatech projects, AI client work.
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
- **Blog off-site (Dev.to):** cedes topical SEO for distribution; case studies + /now + /uses carry on-site AEO.
- **GA4:** familiarity wins; revisit if EU consent UX becomes annoying.
- **Link-first booking:** context switch at CTA accepted in exchange for zero third-party weight at launch; embed revisited with P2 data.
- **Terminal aesthetic:** deliberately hybrid so non-technical buyers get a scannable site; if bounce data says otherwise, accents dial down — brand serves conversion, not vice versa.

## 15. Test plan (summary — full artifact: `~/.gstack/projects/adityakdevin-adityakdevin/adityakdevin-master-eng-review-test-plan-20260716-134143.md`)

24 mapped paths: `/api/chat` guardrail branches (rate limit, input cap, spend cap, mid-stream failure, injection persona [→EVAL]), `/api/contact` (validation, honeypot, Resend-down), lib generators (prompt, JSON-LD schema-validity, llms.txt), Dev.to fallback, and 7 E2E flows (booking, form, widget offline/online/degraded, CV print, theme). Framework: Vitest + Playwright + 1 persona eval. Every phase's acceptance includes "suite green".

## 16. NOT in scope (considered, explicitly deferred)

- **RAG pipeline** — deferred to TODOS.md; cached full-corpus prompt is the launch architecture (corpus ≈15–25k tokens; caching beats retrieval at this size).
- **On-site blog** — Dev.to stays canonical (interview decision); revisit only if AEO data demands it.
- **Inline cal.com embed** — P2 experiment, not launch scope.
- **Anchor-URL redirects** — cut; hash fragments never reach the server, nothing to 301.
- **WhatsApp CTA, newsletters, dark-mode-only art directions** — not requested, not built.
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
| Codex Review | `/codex review` | Independent 2nd opinion | 1 | CLEAR (outside voice) | 30 raw points → 6 decisions, all resolved |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | CLEAR (PLAN) | 8 issues + 24 test gaps → all folded, 0 critical gaps |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | — | — |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | — |

- **CODEX:** outside voice (GPT-5.5) ran on the spec; substantive additions: P1 split (accepted), email-DNS checklist (accepted), own-work launch proof (accepted), link-first booking (accepted, overriding Claude's embed preference), privacy page (accepted), 10 hygiene notes (accepted).
- **CROSS-MODEL:** overlap on spend-gate enforcement, Dev.to fallback, KV deprecation — both models agree; one genuine tension (embed vs link) resolved by user in Codex's favor.
- **VERDICT:** ENG CLEARED — ready to implement (P1a).

NO UNRESOLVED DECISIONS
