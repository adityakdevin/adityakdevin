# Case study template

Seven headings, fixed order, 700-1100 words. BudgetGen is ~330 and reads thin;
that is the floor to beat, not the target.

Studies live in `content/data/work.ts` as structured data, not MDX. `lib/prompt.ts`
(the bot corpus), `app/work/page.tsx` and the JSON-LD all read the fields, so a
prose blob would split the source of truth three ways.

## The seven sections

| # | Heading | What goes in it |
|---|---|---|
| 1 | `The problem` | The situation before you, in the client's terms. Not the tech. |
| 2 | `The constraints` | Budget, deadline, legacy system, compliance, team size. Constraints are what make the decisions interesting. |
| 3 | `The architecture` | How it fits together. Use `pre` for an ASCII diagram - it survives NDAs, costs no LCP, and diffs in git. |
| 4 | `Decisions that mattered` | Each one names the option you did **not** take, and why. A decision with no discarded alternative is a description. |
| 5 | `The numbers` | Comes from `outcome[]`. Every value carries a `source`. No source, no number. |
| 6 | `What broke` | **Mandatory.** The section no agency writes and the one a technical buyer scans for first. |
| 7 | `The outcome` | Where it stands now. Link the live system if it is public. |

## Fields

```ts
{
  slug, title, date: "yyyy-mm-dd", summary, stack: [],
  published: true,                    // gate: false = 404 everywhere
  client?: "Client A",                // named only with permission on file
  outcome?: [{ metric, value, source }],   // source is REQUIRED
  testimonial?: { quote, author, role },
  sections: [{ h, body: string | string[], pre? }],
}
```

`body` takes an array for multiple paragraphs. `pre` renders a monospaced block
with its own `overflow-x` (this page has no `.prose-post` wrapper, so the
global `pre` rule never reaches it).

## Before you commit

1. `node ../scripts/text-hygiene.mjs --phrases content/data/work.ts`
   Client studies will trip the `unpermissioned-claim` patterns - those are hard
   blocks, not warnings. A client saying "yes, use our numbers" is not enough on
   its own: the figure has to land in `ops/voice.md` under "Numbers I can cite"
   **with its exact caveat**, or the lens blocks it regardless of permission.
2. `npx vitest run` - the honesty tests refuse to publish a study whose numbers
   have no source, or a client study with no numbers at all.
3. Remember the corpus. Everything you write here is read aloud by the terminal
   bot. Two guards in `tests/unit/` assert on the built prompt; prose that quotes
   an env var name or an interpolation bug can trip them.

## Publishing rules

- `published: true` is the only gate. A draft client study can sit in the file
  indefinitely; it stays 404 at `/work/<slug>`, absent from `/work`, out of the
  sitemap, and out of the bot corpus.
- `/work` itself 404s below two published studies (`MIN_STUDIES`), and the
  footer link is gated on the same rule.
- No client name without written permission. `client: "Client A"` is the
  supported answer to "no".
