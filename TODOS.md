# TODOS

## Generate visual mockups of the approved homepage design

- **What:** Configure an OpenAI API key for the gstack designer (`~/.claude/skills/gstack/design/dist/design setup`, or key in `~/.gstack/openai.json`), then run `/design-shotgun` (or re-run `/plan-design-review`) to generate 3 variants of the now-fully-specified homepage and pick on a comparison board.
- **Why:** The hero composition (name-as-output + duotone photo anchor, decided 2026-07-16) is the highest-taste-risk element; seeing it before building catches what text specs can't.
- **Pros:** Visual confirmation of all 10 design-review decisions before P1a build effort.
- **Cons:** Needs an OpenAI API key (~$0.50 of image generation).
- **Context:** /plan-design-review 2026-07-16 ran text-only because the designer binary had no key. The full design brief lives in PORTFOLIO_SPEC.md §4–§5B.
- **Depends on / blocked by:** OpenAI API key. Do before the P1a hero build starts.

## Upgrade chatbot from cached-corpus prompt to RAG

- **What:** Swap the terminal chatbot's cached full-corpus system prompt for the build-time embeddings RAG architecture (chunk + embed `site/content/**` into a static JSON index; Edge route does in-memory cosine similarity).
- **Why:** Turns the bot into a live demo of the Dev.to RAG article — the `source` command can say "you're using it right now." Pure marketing/dogfooding value; NOT a quality need (corpus ≈15–25k tokens fits in one cached prompt, which answers better and costs less at this size).
- **Pros:** Strongest possible payoff for the article; proof-by-product.
- **Cons:** Reintroduces the embeddings pipeline, index versioning, and retrieval-quality tuning that the eng review cut from launch scope.
- **Context:** Decided at /plan-eng-review Step 0 (2026-07-16). The chatbot ships in Phase 3 with `lib/prompt.ts` building one cached system prompt. This TODO replaces that internals-only layer; the widget UX doesn't change.
- **Depends on / blocked by:** Dev.to post #3 (RAG in Laravel) published; Phase 3 widget shipped and stable in production.
