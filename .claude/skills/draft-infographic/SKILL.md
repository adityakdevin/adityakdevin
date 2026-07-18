---
name: draft-infographic
description: Draft + render a branded developer reference infographic (table, grid, cheatsheet, or diagram) from a topic, then stage it for a one-tap LinkedIn post. Thin wrapper over apps/infographic. Use when the user says "draft an infographic", "make a <topic> comparison/cheatsheet card", or runs /draft-infographic.
---

# draft-infographic

Turns a topic into a branded 1080x1350 PNG (adityadev.in dark-terminal brand) using
the `apps/infographic` tool. Topic-first: the model drafts the DATA, the
deterministic renderer draws it, the human fact-checks before posting. Nothing
auto-posts.

## Layouts
- `table` — X vs Y comparison (MERN vs PERN)
- `grid` — status-colored cells (HTTP codes)
- `cheatsheet` — multi-section reference (SQL)
- `diagram` — center hub + satellites (tool map)

## Steps

1. Pick the layout that fits the topic (comparison -> table, "top N codes" -> grid,
   reference -> cheatsheet, ecosystem map -> diagram). Confirm with the user if unclear.

2. Draft the data (needs `ANTHROPIC_API_KEY`):
   ```bash
   node apps/infographic/draft.mjs "<topic>" --layout <layout>
   ```
   Writes `ops/social/posts/<slug>/infographic.json`. If no API key, hand-write
   that JSON instead (see any existing `ops/social/posts/*/infographic.json`).

3. **Fact-check the JSON.** Topic-first drafting means the model wrote the facts from
   memory. Read every value; fix anything wrong. This is the correctness gate.

4. Render:
   ```bash
   node apps/infographic/render.mjs <slug>
   ```
   Produces `ops/social/posts/<slug>/assets/<slug>-<layout>.png` (asserted 1080x1350).
   Show it to the user.

5. Write a caption to `ops/social/posts/<slug>/caption.txt`, then stage the post:
   ```bash
   node apps/infographic/post.mjs <slug>
   ```
   Caption goes to the clipboard, PNG is revealed in Finder, composer opens. The
   user drags the image + pastes the caption. Nothing posts automatically.

## Notes
- `apps/infographic/schema.mjs` enforces per-layout bounds; over-bound data is
  rejected (trim it), never shrunk.
- Do NOT use generative image models for the card itself — they hallucinate text.
