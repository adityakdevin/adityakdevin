# Editorial calendar - Aug 2026 to Jan 2027

Fortnightly, the 1st and the 15th, matching the existing launchd reminder and
`/draft-devto-post`. Stack rotation is enforced: no two same-stack posts adjacent,
one buyer-track post per month.

The launch pattern was four posts across three days, then silence. The cadence is
the deliverable, not the backlog.

| # | Date | Slug | Track | Status |
|---|---|---|---|---|
| 1 | Aug 1 | `queue-based-ai-workflows-in-laravel-jobs-retries-and-cost-control` | Laravel | **written** |
| 2 | Aug 15 | `what-an-ai-chatbot-actually-costs-to-build-and-run` | Founder | to write |
| 3 | Sep 1 | `rate-limiting-and-spend-caps-for-ai-routes-in-nextjs` | Node | to write |
| 4 | Sep 15 | `prompt-caching-what-it-actually-saves` | Laravel | to write |
| 5 | Oct 1 | `llm-eval-harness-python` (+ public repo `llm-evals`) | Python | to write (L) |
| 6 | Oct 15 | `dont-build-an-ai-chatbot` | Founder | to write |
| 7 | Nov 1 | `streaming-ai-in-nextjs-with-the-vercel-ai-sdk` | Node | to write |
| 8 | Nov 15 | `testing-ai-features-in-laravel` | Laravel | to write |
| 9 | Dec 1 | `fastapi-celery-llm-jobs` (+ repo `fastapi-llm-jobs`) | Python | to write (L) |
| 10 | Dec 15 | `what-an-ai-integration-audit-finds` | Founder | to write |
| 11 | Jan 1 | `cutting-llm-costs-in-production-laravel` | Laravel | to write |
| 12 | Jan 15 | `offline-first-ai-widget` | Node | to write |

## Why each one, in this position

1. **Queue-based AI workflows.** The only broken promise on the site: post 4 named
   this exact title in published, indexed copy and it was never written.
2. **What an AI chatbot actually costs.** BOFU. Puts the $2,000-$8,000 band on an
   indexable page instead of inside a collapsed `<details>`. Cite the allowlisted
   figure with its exact caveat: *under a cent per resolved support conversation,
   model inference only.* `$2,000-$8,000` passes the lens; a `10-15%`-shaped range
   does not.
3. **Rate limiting and spend caps in Next.js.** First proof of any kind for
   `/services/nodejs-ai-development`. Worked example is `app/api/chat/route.ts`.
4. **Prompt caching.** The defect fixed in Phase 0, with file and line numbers.
   Write it *after* the `cacheReadInputTokens` number is real.
5. **LLM eval harness (Python).** `/services/python-ai-development` has zero Python
   evidence in the repo. Fixture set is this site's live public system prompt, so
   every number reproduces.
6. **Don't build an AI chatbot.** Opens on `ops/voice.md`: *"sometimes the honest
   answer is a queue and a cron job, not a model."*
7. **Streaming in Next.js.** The Node twin of the published Laravel SSE post. Same
   engineer, two runtimes, one opinion - that comparison is the differentiator.
8. **Testing AI features in Laravel.** Backed by tests that exist here: the
   golden-file prompt test and `tests/unit/chat-route.test.ts`.
9. **FastAPI + Celery LLM jobs.** Deliberately the same argument as post 1 in a
   second runtime, stated as such. Range proven with a repo, not a claim.
10. **What an AI integration audit finds.** BOFU. Makes the only productized offer
    visible outside three service pages. Ships with `/services/ai-integration-audit`.
11. **Cutting LLM costs.** Five levers from one running endpoint with public source.
    Ends on the ceiling, not a win: in-memory counters are per-instance, so the cap
    is `$10 x instances`.
12. **Offline-first AI widget.** The widget answers ten commands with no model at
    all. AI is the fallback, not the feature.

## Linking rules - mechanical, every post

1. One service-page link matched to the stack (Laravel / Node / Python; Founder
   posts link `/hire` plus the relevant service page).
2. One backward link to a prior post, **relative path** - not an absolute
   `https://adityadev.in/blog/...`.
3. One proof link: `/work/askaditya-terminal-assistant` or
   `/work/shipping-a-claims-lens`.
4. The page template already appends a booking CTA carrying `?ref=blog-<slug>` and
   a `/#contact` button. Do not hand-roll a second booking link in the body with a
   different ref format.

No post ships naming a "next post" that is not a link. That is how three dead
teases ended up in the first four posts.

## Per-post ritual

```
canonical MDX in content/posts/
  -> deploy, verify 200
  -> /draft-devto-post  (canonical_url set)
  -> /post              (social pack)
  -> node ../scripts/text-hygiene.mjs --phrases content/posts/<slug>.mdx
```

**The path is not optional.** `--phrases` with no path scans zero files and exits
0, printing `0 file(s) scanned, clean.` The documented ritual used to do exactly
that, so every post would have passed a check that could not fail.

Watch for hard blocks in service-adjacent copy: `robust`, `seamless`, `leverage`,
`unlock`, `crucial`, `delve`. "Robust" is the default word for a post about
production hardening.

## Still open

- **Buttondown RSS-to-email** against `/blog/rss.xml`. `/api/subscribe` is a live
  proxy and the form ships on `/blog`, every post, and all three service pages -
  and no post has ever been sent to that list. Dashboard action, needs Aditya.
- **Repatriate series part 1.** The oldest post opens by sending readers to Dev.to.
  Import as `content/posts/adding-an-ai-chatbot-to-your-laravel-app-with-the-openai-api.mdx`
  with `canonical: "https://dev.to/adityakdevin/..."` - exactly the case the
  `canonical` field exists for, and `app/sitemap.ts` already excludes
  canonicalised posts.
- **Syntax highlighting.** `pre code` has none in either theme. Nine of twelve
  posts are code-heavy. A rehype highlighter is the only new dependency this plan
  would justify, and it is optional.
