# Content Voice Plan - write human, not AI-shaped

Goal: blog + social content that reads as Aditya shipping real systems, not an
assistant summarizing tips. AI detectors flagged the drafts at 85-92% AI. That
number is a proxy; the real target is voice. Content that sounds like a specific
person gets replies from founders. That is the point, not a green checkmark.

## The reframe (read first)
- Do NOT chase the detector percentage, and NEVER use a "humanizer" tool. It
  just re-rolls AI text into different AI text, often more generic. You plateau.
- Optimize for voice. The score drops as a side effect, and people actually reply.
- The content the detector flagged was AI-drafted (by the draft-* skills). The
  fix is a real edit pass now, plus building the skill to draft human-first.

## Why drafts score 85-92% (the tells)
Every one of these is what a detector measures:
- Template openers: "Most X don't Y, they Z", "Here's what I've learned".
- Antithesis on repeat: "not wrong enough... just wrong enough", "It's not X, it's Y".
- Rule-of-three lists and triadic escalation ("The demo works. The launch works. Then...").
- Signposts: "The truth is", "At the end of the day".
- Aphoristic closers on every paragraph ("They remember it.").
- Uniform sentence rhythm (low burstiness). Biggest tell.
- Round safe numbers ("10-15%") instead of odd specifics ("about 1 in 8").

## Track 1: The de-AI edit pass (10 min, run on every draft)
Gets a draft from ~90% to ~20-30% AI:
1. Rewrite the first two lines from a real moment/scene, not a thesis.
2. Break the rhythm: make one tidy sentence very short, run another long and messy.
3. Kill the antithesis and rule-of-three: cut one "not X, it's Y"; turn one 3-item list into 2 plus a tangent.
4. De-round one number, add one specific (a date, a tool, a permissioned client detail).
5. Cut every signpost on sight.
6. Add one human imperfection: an arguable opinion or a small admission.
7. Break the template: not every post is hook -> problem -> 3 bullets -> CTA.

## Track 2: Build the skill (8 weeks, compounding)
- Weeks 1-2 Voice inventory: collect 5 things you actually said to a client this
  month. Write one post a week starting from one of them, no AI.
- Weeks 3-4 The "boring specific" drill: every post carries one detail only you know.
- Weeks 5-6 Rhythm: read drafts aloud; rewrite any robotic line the way you'd say it.
- Weeks 7-8 Draft naked, edit with AI: you write the ugly first draft, AI only tightens.
- Throughout: keep `ops/voice.md` (gitignored) of phrases that are yours.

## Track 3: Fix the pipeline (done)
- Shared rules: `~/.claude/skills/draft-social-post/human-voice.md`.
- Private phrases: `ops/voice.md` (gitignored) - fill it from real client talk.
- The three draft-* skills (social-text, social-media, devto) now read both
  before writing, so drafts start human.

## The standing assignment
Rewrite the first 5 lines of any AI draft by hand (Track 1), no humanizer, then
re-check the detector. That one rewrite teaches the pattern faster than re-reading this.

## Status
- Pipeline (Track 3): done.
- ai-automation LinkedIn + X: rewritten v2 in human voice.
- Next: streaming pack, then the blog posts themselves (the .mdx prose).
