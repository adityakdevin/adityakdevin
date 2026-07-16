# TODOS

## Upgrade chatbot from cached-corpus prompt to RAG

- **What:** Swap the terminal chatbot's cached full-corpus system prompt for the build-time embeddings RAG architecture (chunk + embed `site/content/**` into a static JSON index; Edge route does in-memory cosine similarity).
- **Why:** Turns the bot into a live demo of the Dev.to RAG article — the `source` command can say "you're using it right now." Pure marketing/dogfooding value; NOT a quality need (corpus ≈15–25k tokens fits in one cached prompt, which answers better and costs less at this size).
- **Pros:** Strongest possible payoff for the article; proof-by-product.
- **Cons:** Reintroduces the embeddings pipeline, index versioning, and retrieval-quality tuning that the eng review cut from launch scope.
- **Context:** Decided at /plan-eng-review Step 0 (2026-07-16). The chatbot ships in Phase 3 with `lib/prompt.ts` building one cached system prompt. This TODO replaces that internals-only layer; the widget UX doesn't change.
- **Depends on / blocked by:** Dev.to post #3 (RAG in Laravel) published; Phase 3 widget shipped and stable in production.
