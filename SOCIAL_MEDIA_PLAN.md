<!-- /autoplan restore point: ~/.gstack/projects/adityakdevin-adityakdevin/master-autoplan-restore-20260717-233615.md -->
# Social Media Plan - adityadev.in (July 2026)

> Distribution layer for `CONTENT_PLAN.md`. Same goal, same reader, same
> pipeline. Read `CONTENT_PLAN.md` and `CONTENT_LAUNCH_CHECKLIST.md` first.
> **Revised 2026-07-17 after /autoplan (CEO + Eng + DX, dual-voice).** Both CEO
> voices challenged the original 9-platform scope; this revision keeps LinkedIn +
> IG/FB native (owner's call) but adds the missing lead motion (direct outreach),
> a funnel-proof gate, and the engineering fixes. Review report + audit trail at
> the bottom.

## Goal (inherited, do not re-litigate)

**Freelance/client leads from founders and CTOs.** Followers, likes, and reach
are leading indicators, never the target. The number to hit is small: **~3
attributable leads.** For a target that small, 1:1 beats broadcast - so the plan
now leads with outreach and treats social as support.

## Fastest path to 3 leads (the ranking both models forced)

Ranked by expected leads-per-hour for a solo dev:

1. **Direct outreach** - 5-10 researched touches/week to named founders/CTOs,
   each anchored to a relevant post or case study. Highest intent, fastest.
2. **LinkedIn depth** - real engagement (comment on prospects' posts, DM
   relationships), not broadcast. The buyer lives here.
3. **Named case studies** - the highest-conversion content asset; every outreach
   and post ladders to one.
4. **Selective submissions** - HN / Reddit / the stack newsletter matching the
   post (Laravel News, Node Weekly, Python Weekly) on the *strongest* posts only.
   Backlinks + buyer-adjacent reach.
5. **X / build-in-public** - a *secondary* engine: builds peer authority and a
   referral network (a warm lead path), not direct founder contracts. Judged on
   referrals + reach, not the primary lead metric.
6. **Broadcast social** (IG/FB/mirrors) - lowest leads-per-hour, kept because the
   owner wants presence, funded by automation, on a kill-timer.

**Funnel-proof gate (do this before scaling any broadcast channel):** ship 4-6
posts, drive traffic by outreach + LinkedIn, and confirm at least one
blog-reader → contact-form conversion fires. Distribution multiplies a working
funnel; it can't create one. If concentrated effort on one channel yields zero
leads, a ninth channel won't help - it hides the failure under activity.

## Channel tiers (revised)

| Tier | Channel | Effort | Motion | Cadence |
|------|---------|--------|--------|---------|
| **0 - primary** | **Direct outreach** (email + LinkedIn DM) | High | 1:1 to named founders/CTOs, case-study as proof | 5-10 touches/wk |
| **1 - native** | **LinkedIn** | High | Write + engage (comments/DMs are the point) | 2-4 quality posts/mo, daily light engagement |
| **1 - active (secondary goal)** | **X / Twitter** | Med | **Build-in-public + dev threads** → peer audience & authority. Converts via referrals, not direct contracts | 2-4 posts/wk + engage |
| **1 - native (owner call)** | **Instagram + Facebook Page** | Med | Case-study / proof carousels via Meta cross-post | Opportunistic, **kill-timer** ↓ |
| **2 - opportunistic** | **Bluesky / Mastodon / Threads** | ~0 | One-paste mirror of X posts **only when already strong** - no weekly obligation | Ad hoc |
| **3 - submission** | **HN**, **Reddit** (r/PHP, r/laravel, r/node, r/Python, r/webdev), **stack newsletters** (Laravel News, Node Weekly, Python Weekly / PyCoder's) - all rank above IG/FB | Low-Med | Value-first, rules-checked, best posts only; submit to the community matching the post's stack | Per strong post |

**IG/FB kill-timer (owner override, honored with a trip-wire):** IG + FB native
was your explicit call over both models' "defer to link-only." Kept - but
time-boxed: **if IG/FB drive zero blog-referral clicks by end of month 2, they
drop to dormant/link-only.** Near-zero effort × zero buyer intent is still zero
leads, so the trip-wire is written in, not left to vibes. Reels stay optional.

## Content mix

1. **Outreach anchors (primary):** each week, 5-10 personalized touches to named
   prospects who visibly have the Laravel+AI problem you solve, each pointing at
   one relevant post or case study.
2. **Post-ship distribution:** every blog post → LinkedIn post + (strong posts)
   X thread + one submission. IG/FB carousel + mirrors are opportunistic, not
   required.
3. **LinkedIn - founder-facing expertise:** standalone posts reframed from
   generic dev lessons to **founder angles** - "what this class of bug costs a
   startup," "the architecture decision that saved a client $X." Build detail is
   *proof*, not the point. **Trigger-based, not a quota:** post when (a) a post
   ships, (b) a case study closes, or (c) you hit a non-obvious client insight.
   ~2-4 high-quality posts/mo.
4. **X - build-in-public + dev content:** the build-in-public stream lives here,
   where its actual audience (devs, peers, tool-curious) is. Snippets, TILs,
   what-broke-and-how, shipping updates. Serves the **secondary goal**: peer
   authority + referral network, not direct founder leads. Mirror to
   Bluesky/Mastodon/Threads when a post lands well. Same content can graft onto
   LinkedIn *only* when it has a founder-relevant angle.

## Positioning + content themes (the production-AI spine)

**Positioning: full-stack AI engineer - Laravel, Node.js, and Python.** The
languages are equal billing; the differentiator is *not* the stack. It's
**"production AI that works, for real clients, with real numbers."** That's the
moat AI-tip accounts can't copy, and it's stack-independent - a Node RAG pipeline
and a Laravel automation both prove it. Show the range across all three; let the
real-client-results do the differentiating.

> Positioning note (the tradeoff you accepted): equal-billing across three stacks
> widens the net but weakens specialist findability and dilutes the existing
> "hire Laravel AI developer" search equity. Mitigation, not in this file:
> keep the Laravel service page as one specialized SEO pillar and add sibling
> pages (Node / Python) rather than genericizing the existing one. Tracked as a
> `CONTENT_PLAN.md` decision.

The AI topics, mapped to where each earns its keep. **Spine rule: every theme
carries "shipped in production for real clients (Laravel, Node, or Python)" or
it's competing with infinite AI slop and converts to nobody.** Rotate the stack
across posts so all three read as first-class, not Laravel-with-footnotes.

| Theme | Channel(s) | Framing |
|-------|-----------|---------|
| **AI automation** | LinkedIn + blog | Founder-facing. "AI automation that saved a client X hours" - Laravel queue, a Node worker, or a Python job. Highest lead value. |
| **E2E AI workflows** | LinkedIn + blog | "End-to-end AI workflow in production, with cost + result numbers" - pick the stack that fits the client. Your differentiator. |
| **AI generation** | X + blog | Dev-facing. "Generating X in a real app" - Laravel/Node/Python code, not think-pieces. |
| **Prompting** | X + blog | "Prompt engineering *in a shipped feature*" - versioning, testing, cost control, any stack. |
| **New AI Era / model updates** | X only | Fast, ephemeral, peer reach. Zero lead intent - never a blog post. |

Routing logic: **founder track** (AI automation, E2E workflows) → LinkedIn +
blog, told through client builds with numbers, stack rotated. **Dev track** (AI
generation, prompting, model news) → X build-in-public, for peer reach +
referrals. Model-news commentary stays on X and dies there - most saturated
content on the internet, differentiates nothing on its own.

## Weekly rhythm (~2 hrs, outreach-first)

| Block | Action | Time |
|-------|--------|------|
| **Outreach** | 5-10 researched touches to named founders/CTOs + 5 warm comments on their posts | ~40 min |
| **LinkedIn** | One founder-facing post *if triggered* + reply to your comments + engage 3-5 prospect posts | ~30 min |
| **X** | 2-4 build-in-public posts + reply to threads/mentions | ~30 min |
| **Distribution** | Approve the auto-drafted pack for any post that shipped; paste where it fits | ~20 min |

Outreach still gets the primary weight - it's the lead motion. Adding X as an
active channel is the reason the budget went from ~90 min to ~2 hrs; that's the
honest cost of a second active audience. Bluesky/Mastodon/Threads/IG/FB stay
fire-and-forget or skipped without guilt.

## Automation - a command family, split by modality

Social drafting is split by content type (they're genuinely different jobs), each
a skill that writes a **publish checklist** (not just copy) under `ops/social/`
(gitignored - see "Where drafts live"). Each starts with a short content/visual
brief (the plan phase) before drafting:

| Command | Covers | Writes | Type |
|---------|--------|--------|------|
| **`/draft-social-text`** | X, LinkedIn, text mirrors (Bluesky/Mastodon/Threads), text submissions (Reddit/HN/newsletter) | `ops/social/<slug>.text.md` | short text |
| **`/draft-social-media`** | Instagram + Facebook: carousels + **reels** (script, shot list, on-screen text) | `ops/social/<slug>.media.md` | visual / video |
| **`/draft-devto-post`** | blog canonical + Dev.to | the post itself | long-form |
| **`/draft-social-post`** | router - dispatches to the right one, or runs both text+media | - | - |

The text checklist structure (media is analogous with a `slides:` + reel block):

```
---
postSlug: <slug>
canonicalPath: /blog/<slug>
refs: { linkedin: li, x: x, reddit: reddit, ig: ig }
slides:                      # structured - single source for humans AND any future renderer
  - { role: hook,    text: "..." }
  - { role: problem, text: "..." }
  - { role: code,    text: "..." }   # optional; omit if the post has no fit-able snippet
  - { role: result,  text: "..." }
  - { role: cta,     text: "..." }
platforms: [linkedin, x]    # what to actually post; edit freely
---
## Pack Health
- LinkedIn copy: pass
- First-comment link (...?ref=li): pass
- Carousel PNGs: deferred (text-only)
- Reddit: no subreddit selected - skip
- Staleness: generated <date>

## LinkedIn   [ ] posted
<hook line>
<3-5 bullets>
<soft CTA>
First comment: https://adityadev.in/blog/<slug>?ref=li

## X   [ ] posted
<thread, 5-8 tweets>  (~280 char/tweet)
...
```

Design decisions locked by the eng review:

- **Do NOT build `/api/social-card` in the first cut.** A public `?slug=&slide=`
  satori route is an unauthenticated CPU-amplification endpoint - the repo
  already avoids exactly this in `opengraph-image.tsx:16` via build-time render.
  Carousels come later as a **build script** emitting static PNGs into
  `ops/social/<slug>/slide-N.png`, only after the pack format proves useful and
  IG/FB clear the month-2 kill-timer.
- **The carousel is a new template, not `og.tsx` reuse.** `og.tsx` is a fixed
  1200×630 landscape with a hard-coded accent width; carousels are 1080×1350
  (4:5). Reuse only the font-loader (~6 lines) and color tokens. Satori can't
  syntax-highlight, wrap, or scroll - code slides must be pre-fit short excerpts,
  and every div needs explicit `display:flex`.
- **Escape-hatch knobs** in the pack frontmatter: `platforms: [linkedin]`,
  `cards: false`, `voice: founder-facing|technical|client-outcome`,
  regenerate one slide/section without redrafting the whole pack.

**Posting stays manual (draft-assist only).** LinkedIn/IG/Reddit ban API
auto-posting; a ban costs the anchor channel. Scheduler (Buffer/Typefully) is a
*later*, *scheduling-only* option, never for generation.

### Where drafts live (repo is public)

Put packs under `ops/social/` (gitignored) or `.drafts/`, **not**
`site/content/social/`. The blog loader (`posts.ts:11`) is scoped to
`content/posts`, so a sibling wouldn't be *served* - but this repo is public, so
draft copy under `site/content/` would be visible on GitHub. Gitignore it.

## Attribution - fix the two real bugs (not "1 hr", it's a real ~2h build)

The plan's "extend existing attribution" was wrong - `?ref` is dropped twice
today. Both must be fixed or the whole thing silently no-ops while *looking*
wired:

1. **Capture (`site/lib/track.ts`):** `stampSession()` stores `location.pathname`
   only - the query string is thrown away. Inside the first-touch guard
   (`if (!sessionStorage.getItem(FIRST_LANDING_KEY))`), add:
   `const ref = new URLSearchParams(location.search).get('ref'); if (ref) sessionStorage.setItem('first_ref', ref)`.
   First-touch is correct for social entry links. Add `first_ref` to
   `getAttribution()`'s return (`ContactForm.tsx` already spreads it).
2. **Accept (`site/app/api/contact/route.ts:90-94`):** `attrValue()` validates
   every key against a path regex (`must start with /`, a red-team hardening), so
   `"li"` is filtered to `""`. Add a `ref` branch
   (`/^[a-z0-9][a-z0-9_-]{0,31}$/`) and add `ref`/`first_ref` to the accepted-key
   tuple at line 92.
3. **Links:** add `?ref=li|x|ig|reddit|...` to every posted URL. A `withRef(url, ref)`
   helper unifies the cal.com links (`page.tsx:68`, `services/...:118`) that
   currently hand-roll refs, and the bare `profile.bookingUrl` in
   `ContactForm.tsx:73`.

Attribution captures **source only** - pair it with a manual note of persona /
company / project value per lead. `?ref=ig` and a founder booking a call are not
the same event; optimize for qualified conversations, not raw ref hits.

## Tests (the plan specified none)

- `track.test.ts`: `stampSession` captures `ref` from `location.search`;
  `getAttribution` returns it; first-touch holds (a later same-session nav
  without `?ref` doesn't clear it).
- `contact-route.test.ts`: new `ref` key accepted (`li` passes); the *old* path
  validator still rejects a bogus `ref` (this catches Bug B).
- Future card script: assert 200 + `image/png` + non-empty for a known
  slug/slide; 404 unknown slug; 400/404 out-of-range slide.

## Rollout (outreach-first, ramp the rest)

- **Month 1:** LinkedIn native + **direct outreach** (the primary block) + wire
  the `?ref` fix and the minimal social-pack `.md`. Hit the funnel-proof gate.
- **Month 2:** add X + opportunistic mirrors + first Laravel News/HN/Reddit
  submission on the strongest post. **IG/FB kill-timer checkpoint.**
- **Month 3:** only if IG/FB earned it, build the carousel PNG script. Test one
  new channel at most.

Onboarding: a one-time `ops/social/social-setup.md` checklist ( drafted) with the *actual* handles,
profile URLs, per-platform bios, avatar/banner paths, target subreddits, and
paste URLs - the "claim 9 handles" line is not executable without it. Don't claim
handles you won't feed; an abandoned Mastodon reads as quit, worse than absent.

## Success check

- **Primary (month 4+):** ≥3 attributable leads (per `CONTENT_PLAN.md`), now
  platform-traceable via `?ref` + a manual persona/value note per lead.
- **Leading (weeks 2-12):** outreach replies + calls booked; LinkedIn profile
  views + connection requests from founders/CTOs; blog referral traffic by
  platform.
- **X (secondary goal):** judged on peer reach + follower growth + any
  referral/inbound, NOT the founder-lead metric. Checkpoint at month 2 - if it's
  eating time with no referral, inbound, or audience traction, cut back to
  opportunistic. Don't let a secondary channel starve the primary outreach block.
- **Hard kill rules (not "review what converts"):** any *founder-facing* channel
  with **no founder/CTO conversation after 4 posts or 4 weeks → dormant.** IG/FB:
  zero referral clicks by end of month 2 → link-only. No exceptions for vanity reach.

## Do not do

- No API auto-posting (ban risk). Draft-assist only.
- No identical copy everywhere (throttled as spam).
- No vanity-metric chasing; the metric is qualified conversations.
- No fixed posting quota - trigger-based, quality-gated.
- No local-India-SMB / city-service language here (deferred track in `CONTENT_PLAN.md`).
- No `/api/social-card` public route in the first cut; no carousels before the
  IG/FB kill-timer clears.

## Out of scope

- Paid ads (organic + outreach first; revisit as a separate track if speed to
  lead demands it).
- YouTube / long-form video.
- API auto-posting of any kind.

## Effort / files

| Item | Where | Effort |
|------|-------|--------|
| `?ref` capture + accept + `withRef` helper | `site/lib/track.ts`, `site/app/api/contact/route.ts`, cal.com links | ~2 h |
| Social command family (`/draft-social-text`, `/draft-social-media`, router) | `~/.claude/skills/draft-social-*/SKILL.md` -  built | done |
| Tests (track + contact route) | `site/tests/unit/` | ~1 h |
| Carousel PNG **build script** ( built, brought forward - FB Page + IG Business ready) | `site/scripts/social-card.mjs` (`bun run social-card <slug>`), reuses og.tsx font/color primitives | done |
| Outreach system + `social-setup.md` | manual + one config file | ~2 h setup |
| Weekly ongoing | you | ~90 min/wk (outreach-first) |

---

<!-- AUTONOMOUS DECISION LOG -->
## /autoplan Review Report (2026-07-17) - HYBRID resolution applied

Reviewed via /autoplan (CEO + Eng + DX, dual-voice). Owner chose the **hybrid**
resolution: keep LinkedIn + IG/FB native, add the missing outreach motion + a
funnel-proof gate, demote the zero-value mirrors, apply all engineering fixes.
This revision reflects that.

### Consensus tables
- **CEO - 6/6 confirmed (Codex + Claude subagent):** distribution scaled before
  the funnel converted once; outreach + LinkedIn-depth + case studies beat 9
  feeds; IG/FB/mirrors are low buyer-intent; "1-2 hr/week for 9 platforms" is
  unrealistic; organic social is a decaying 2026 lead channel. Keep: `?ref`,
  `og.tsx` reuse, no-API-posting.
- **Eng - 6/6 confirmed (Codex + Claude subagent):** don't build
  `/api/social-card` now (CPU-amplification; repo precedent `opengraph-image.tsx:16`);
  `og.tsx` won't extend to carousels (new template); slide copy has no data
  source (needs `slides:` contract); `?ref` is two silent-failure bugs
  (`track.ts:16` strips query, `route.ts:90` rejects non-path values); no tests.
- **DX - Codex-only (Claude DX subagent failed twice, marked unavailable):**
  artifact should be a publish checklist + Pack Health + escape knobs +
  `social-setup.md`, not raw copy.

### Cross-phase theme
**Defer the carousel renderer** - flagged in CEO (no IG/FB machinery before
buyer-pull proof), Eng (build script not a route), and DX (assets are the hard
part). Applied.

### Decision audit trail
| # | Phase | Decision | Class | Principle |
|---|-------|----------|-------|-----------|
| 1 | Eng | Defer `/api/social-card`; ship minimal pack `.md` first; carousels = build script, month 3 | Mechanical | P5, P2 |
| 2 | Eng | Carousel = new build-time template, reuse only font/color primitives | Mechanical | P5 |
| 3 | Eng | Fix `?ref`: first-touch capture in `track.ts` + `ref` allowlist in contact route + `withRef` helper | Mechanical | P1 |
| 4 | Eng | Structured `slides:` block as single source | Mechanical | P5 |
| 5 | Eng | Add track + contact-route tests | Mechanical | P1 |
| 6 | DX | Pack = publish checklist + Pack Health + escape knobs + `social-setup.md` | Mechanical | P1, P5 |
| 7 | Eng | Social drafts under `ops/social/` (gitignored) - repo is public | Mechanical | - |
| 8 | CEO | **UC1** - keep IG/FB native (owner), demote Bluesky/Mastodon/Threads to opportunistic, add kill-timer | **User Challenge → hybrid** | owner autonomy + evidence |
| 9 | CEO | **UC2** - add direct outreach as the primary Tier-0 motion + funnel-proof gate | **User Challenge → accepted** | evidence |
