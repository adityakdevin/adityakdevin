# Content launch checklist - the human-action items

The code is built (blog, newsletter, service page, attribution - see
CONTENT_PLAN.md). These are the steps only Aditya can do, in priority order.

## 1. Permission email (THIS WEEK - the long-pole blocker)

Send to the client of walkthrough project #1. Draft (edit names/details):

> Subject: Publishing our project as a case study - quick permission request
>
> Hi [Name],
>
> I'm adding detailed case studies to my site (adityadev.in), and the
> [project name] build is the one I'm most proud of. I'd like to publish a
> technical walkthrough of how we built it, plus a short case study. Before I
> write a word, I want to agree on what's OK to publish:
>
> 1. **Name & logo** - may I name [Company] and show the logo?
> 2. **Numbers** - the before/after metrics I'd like to use are:
>    [metric 1: e.g. "manual processing time X hrs → Y min"],
>    [metric 2]. Are these numbers right, and are you comfortable with this
>    exact wording? Happy to use ranges ("~40%") if you prefer.
> 3. **Screenshots** - may I include UI screenshots? I'll blur any customer
>    data; you get to veto any image.
> 4. **Architecture detail** - I'll describe the technical approach (stack,
>    integrations) but nothing you consider a trade secret. Anything
>    specifically off-limits?
> 5. **A quote** - one or two sentences from you about the outcome would make
>    the case study much stronger. Optional but hugely appreciated.
>
> You review everything before it goes live, and I'll take anything down on
> request, any time. Could you reply with an OK (or edits) in the next week
> or two? A simple email approval is all I need on file.
>
> Thanks!
> Aditya

**On reply:** save the email thread as the permission record (spec S13.2
requires written permission on file).

**Fallback (eng review):** if permission is denied or metrics are weak, run
the cluster on a second client project, or publish an anonymized
qualitative-outcome version while permission for project #2 is sought. Do not
stall the phase on one client's reply.

## 2. GSC baseline (BEFORE the first post ships)

1. Open Search Console → adityadev.in → Performance → last 3 months.
2. Export (or screenshot) totals: clicks, impressions, average position, and
   the top-20 queries table.
3. Save to `~/.gstack/projects/adityakdevin-adityakdevin/gsc-baseline-<date>.md`
   (or anywhere durable) - the month-4/month-6 checkpoints compare against this.
4. Note branded-query impressions separately ("aditya kumar developer",
   "adityakdevin", "adityadev") - branded-search lift is a primary lead signal.

## 3. Buttondown account (before the newsletter form goes live)

1. Create the account (free tier), newsletter name: "Field notes".
2. Enable double-opt-in (default).
3. Copy the API key → Vercel env `BUTTONDOWN_API_KEY` (Production +
   Preview). Until the key is set, `/api/subscribe` returns a friendly 503.

## 4. When 1-3 are done

Run `/draft-devto-post` - it now publishes site-first (MDX → deploy verify →
Dev.to draft with canonical_url). Seed posts, in order (CONTENT_PLAN.md):
walkthrough part 1 → named case study → walkthrough part 2 ...

Per-post distribution (GTM checklist, same day as publish): LinkedIn post,
relevant Laravel/AI communities, direct share to client network; case studies
also emailed to the featured client for their own sharing.
