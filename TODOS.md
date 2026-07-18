# TODOS

Organized by component, then priority (P0 highest → P4). Completed items move
to the bottom with their shipping version/date.

## Chatbot / Widget

### Upgrade chatbot from cached-corpus prompt to RAG

- **Priority:** P3
- **What:** Swap the terminal chatbot's cached full-corpus system prompt for the build-time embeddings RAG architecture (chunk + embed `site/content/**` into a static JSON index; Edge route does in-memory cosine similarity).
- **Why:** Turns the bot into a live demo of the Dev.to RAG article - the `source` command can say "you're using it right now." Pure marketing/dogfooding value; NOT a quality need (corpus ≈15-25k tokens fits in one cached prompt, which answers better and costs less at this size).
- **Pros:** Strongest possible payoff for the article; proof-by-product.
- **Cons:** Reintroduces the embeddings pipeline, index versioning, and retrieval-quality tuning that the eng review cut from launch scope.
- **Context:** Decided at /plan-eng-review Step 0 (2026-07-16). The chatbot ships in Phase 3 with `lib/prompt.ts` building one cached system prompt. This TODO replaces that internals-only layer; the widget UX doesn't change.
- **Depends on / blocked by:** Dev.to post #3 (RAG in Laravel) published; Phase 3 widget shipped and stable in production.
- **Amendment (eng review 2026-07-17):** When RAG lands, also ingest `site/content/posts/**` (blog walkthroughs) so the widget answers "how did you build X" - this is the content-engine design's deferred Approach C. Remember to update the prompt-corpus-exclusion unit test when the corpus rule changes.

### Chat spend-cap race under concurrency (adversarial finding, 2026-07-17)

- **Priority:** P3
- **What:** `/api/chat` checks the monthly spend cap before streaming but records spend only after the stream finishes; a burst of parallel requests can all pass the same pre-spend check and overshoot the $10 cap. Per-instance counters multiply the overshoot across serverless instances.
- **Why:** The circuit breaker is enforcement, not an alarm - a race window weakens it.
- **Pros:** Closes the last soft edge on the widget's cost controls.
- **Cons:** A real fix needs shared state (Upstash), which is already the plan for the limiter swap - fold together.
- **Context:** Flagged by the /ship adversarial review 2026-07-17 (Codex). Pre-existing behavior, not introduced by the content-engine changes. Practical exposure is small (10 msg/hr/IP limiter in front of it).
- **Depends on / blocked by:** Upstash adoption (same trigger as the rate-limiter swap noted in `site/lib/ratelimit.ts`).

## Design

### Generate visual mockups of the approved homepage design

- **Priority:** P3
- **What:** Configure an OpenAI API key for the gstack designer (`~/.claude/skills/gstack/design/dist/design setup`, or key in `~/.gstack/openai.json`), then run `/design-shotgun` (or re-run `/plan-design-review`) to generate 3 variants of the now-fully-specified homepage and pick on a comparison board.
- **Why:** The hero composition (name-as-output + duotone photo anchor, decided 2026-07-16) is the highest-taste-risk element; seeing it before building catches what text specs can't.
- **Pros:** Visual confirmation of all 10 design-review decisions before P1a build effort.
- **Cons:** Needs an OpenAI API key (~$0.50 of image generation).
- **Context:** /plan-design-review 2026-07-16 ran text-only because the designer binary had no key. The full design brief lives in PORTFOLIO_SPEC.md S4-S5B.
- **Depends on / blocked by:** OpenAI API key. Do before the P1a hero build starts.

## Social Infographics

### Second-model fact-verify pass for the infographic generator (v2)

- **Priority:** P3
- **What:** Before a topic-first drafted infographic reaches the human, run its drafted facts through a second model that flags likely-wrong claims (wrong HTTP code meaning, bad SQL syntax, etc). A reputation backstop on top of the manual eyeball.
- **Why:** v1 chose topic-first drafting (the AI generates facts from memory), so every graphic is the model's recall published under Aditya's name. The manual pre-post check is the only correctness gate; a second-model verify catches what a tired eyeball misses.
- **Pros:** Cuts the reputation risk of a wrong "fact" shipping; cheap (one extra model call per post).
- **Cons:** Adds latency + a second API call; not free; false-alarms possible.
- **Context:** Decided at /plan-eng-review 2026-07-18 (design doc `adityakdevin-feat-social-poster-v0-design-20260718-183734.md`, Tension 1 → topic-first chosen, verify deferred to v2). Codex outside voice flagged that schema validation checks shape, not truth.
- **Depends on / blocked by:** v1b (the AI-draft step) shipped and producing schema-valid data.

### Golden-image regression tests for infographic layout overflow (v2)

- **Priority:** P4
- **What:** Screenshot-diff / golden-image tests that catch layout overflow and visual regressions when infographic templates change, per layout (table, grid, cheatsheet, diagram).
- **Why:** Dense reference layouts overflow easily; Codex flagged that "legible at 1080x1350" needs automated assertions, not eyeballing, because template tweaks regress overflow constantly.
- **Pros:** Catches a cramped/overflowing card before it ships; protects the four layouts as templates evolve.
- **Cons:** Golden-image infra is heavier than unit tests; goldens need updating on intentional design changes.
- **Context:** Decided at /plan-eng-review 2026-07-18. v1 prevents overflow at the data layer (validator rejects over-bound data) + the human eyeballs every post, so pixel-diff infra was deferred. Build when template churn makes manual checking unreliable.
- **Depends on / blocked by:** v1a renderer shipped (the templates to snapshot must exist).

### Diagram logo assets for the infographic generator (v2)

- **Priority:** P3
- **What:** Add a curated tool-logo library so the `diagram` layout can show logos on its nodes (the "MY AI TEAM" look), instead of the current text-only nodes.
- **Why:** v1 diagram renders center + text satellites + SVG arrows. The reference image gets its punch from tool logos (Claude, ChatGPT, n8n icons). Text-only works but is plainer.
- **Pros:** Diagram cards match the viral reference style; more visual.
- **Cons:** Logo licensing + curation is real work; each logo needs a consistent treatment (size, mono/color) to stay on-brand.
- **Context:** Decided at /plan-eng-review 2026-07-18, deferred through the v1 build 2026-07-18. Renderer is `apps/infographic/templates.mjs` `diagramBody()` - nodes are `.dnode` divs; a logo would sit above the label. Needs an assets dir + a `logo` field on satellites.
- **Depends on / blocked by:** none (diagram layout ships text-only now).

## Completed

### Retroactive canonical migration of top Dev.to posts

- **Priority:** P2
- **Completed:** 2026-07-17 - posts #2 (SSE, devtoId 4156141) and #3 (RAG, devtoId 4159847) republished site-first with original dates; Dev.to canonicals flipped to the site copies; homepage dedupe verified live. Post #1 (chatbot intro, 4156045) deliberately left Dev.to-canonical for now - migrate the same way if/when wanted.
- **What:** Republish the top 2-3 performing Dev.to articles as posts in `site/content/posts/` (using the `canonical` frontmatter override until each is migrated), then edit the Dev.to originals' `canonical_url` to point at the site copies.
- **Why:** Those posts already have traffic and backlinks accruing to dev.to's domain; migration redirects that equity to adityadev.in - the fastest available domain-authority boost.
- **Pros:** Content already written and proven; pure SEO gain.
- **Cons:** Editing an old Dev.to post's canonical can temporarily wobble its ranking; needs per-post judgment on which are worth migrating.
- **Context:** Decided at /plan-eng-review 2026-07-17 (design doc `adityakdevin-master-design-20260717-031600.md`, Open Question 2 → resolved as deferred). Dev.to supports `canonical_url` on article update.
- **Depends on / blocked by:** `/blog` live; `/draft-devto-post` pipeline updated to site-first + canonical_url and proven on new posts.
