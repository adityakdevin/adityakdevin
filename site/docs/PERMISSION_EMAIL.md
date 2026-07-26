# Client permission email (send five copies)

Studies 3-7 in the plan are blocked on these replies. Studies 1 and 2 are
own-work and shipped without them, so `/work` is already live - these unblock
the *named-client* layer, not the page.

## Recipients

| Project | Company | Source in repo |
|---|---|---|
| Laravel 5.1 -> 6.x rescue, Mapbox, Azure AD SSO | RO (`r-o.com`) | `content/data/profile.ts` projects[0] |
| Laravel 8 + Livewire, Dwolla ACH | JPI (`apps.jpi.com`) | projects[1] |
| CodeIgniter + DocuSign airway bills | AWB | projects[2] |
| Razorpay storefront | Mitadass | projects[3] |
| Canadian real-estate portal | RE/MAX Millennium | experience, `remaxmillennium.ca` |

## The email

> Subject: Writing up the [project] build - two quick questions
>
> Hi [name],
>
> I'm writing up the [project] build as a technical case study for my site -
> architecture, decisions, what broke. It's for engineers and founders looking
> at how the system was put together, not a marketing page.
>
> Two questions:
>
> 1. May I name [Company], or would you rather I wrote it as "a logistics
>    company"? Either is fine.
> 2. Can I quote any figures you have - volume, turnaround, cost saved? Only if
>    you're comfortable; the study works without them.
>
> I'll send you the draft before anything goes live.
>
> Thanks,
> Aditya

## What each answer means

- **No to Q1** -> the study still ships. Use `client: "Client A"`.
- **No to Q2** -> ships with `outcome` empty and the numbers hedged in prose.
  The honesty test then blocks it if `client` is set, which is correct: a named
  client study with no sourced number is the exact shape that goes wrong.
- **Yes to Q2** -> **two steps, not one.** Add the figure to `outcome[]` with its
  `source`, *and* add it to `ops/voice.md` under "Numbers I can cite" with the
  exact caveat the client gave it. `scripts/text-hygiene.mjs` blocks the claim as
  `unpermissioned-claim` on commit otherwise, permission or no permission. The
  allowlist is the record that the permission exists.

Keep the reply. "Written permission on file" means a saved email, not a memory
of a call.
