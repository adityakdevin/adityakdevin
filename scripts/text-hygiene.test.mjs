// Tests for text-hygiene's pure functions.
//
// These could not exist until 2026-07-25. detectPhrases and isPhraseLensExempt
// were exported for months with no importer, because main() ran unconditionally
// at module load and ended in process.exit() - importing this file from a test
// ran the whole scan and then killed the runner. The main-module guard fixed
// that; `scripts/` becoming a workspace is what makes `npm test` reach here.

import test from 'node:test';
import assert from 'node:assert/strict';
import { detectPhrases, isPhraseLensExempt, selftestCases } from './text-hygiene.mjs';

// ---------------------------------------------------------------------------
// The 51 built-in assertions, as real test cases. selftestCases() returns them
// as data so each one gets its own name in the runner output instead of being
// a single pass/fail behind a shelled-out CLI.
// ---------------------------------------------------------------------------

for (const c of selftestCases()) {
  test(`selftest: ${c.name}`, () => {
    assert.ok(c.ok, `built-in assertion failed: ${c.name}`);
  });
}

// ---------------------------------------------------------------------------
// Per-category exemption.
//
// The critical one is the third test. If a typo in the categories list silently
// re-exempts voice.md from unpermissioned-claim, the check goes quiet and the
// run still reports clean - which is exactly the state the file was in while it
// held six quotable client claims for weeks.
// ---------------------------------------------------------------------------

test('voice.md is exempt from the vocabulary it defines', () => {
  // Its "Not me (never use)" list names every banned term; scanning for those
  // would flag the file for documenting them.
  assert.equal(isPhraseLensExempt('ops/voice.md', 'ai-vocab'), true);
  assert.equal(isPhraseLensExempt('ops/voice.md', 'round-number'), true);
  assert.equal(isPhraseLensExempt('ops/voice.md', 'launch-cosplay'), true);
});

test('voice.md is NOT exempt from unpermissioned-claim', () => {
  assert.equal(isPhraseLensExempt('ops/voice.md', 'unpermissioned-claim'), false);
});

test('CRITICAL: a client claim in voice.md is still detected end to end', () => {
  // The guard that would have caught the 2026-07-25 audit the day it was written.
  // Detection plus the exemption filter, exactly as the scan loop applies them.
  const text = "I've shipped four of these now and a couple paid for themselves.";
  const kept = detectPhrases(text).filter(
    (f) => !isPhraseLensExempt('ops/voice.md', f.category),
  );
  assert.ok(kept.length > 0, 'a client claim in voice.md must survive the category filter');
  assert.ok(kept.every((f) => f.category === 'unpermissioned-claim'));
});

test('voice.md is not FULLY exempt (the file-skip decision)', () => {
  // Called with no category, this answers "skip the file entirely?". A partially
  // exempt file must be scanned, or the per-finding filter never runs.
  assert.equal(isPhraseLensExempt('ops/voice.md'), false);
});

test('human-voice.md and text-hygiene.mjs stay fully exempt', () => {
  for (const p of ['human-voice.md', 'a/b/human-voice.md', 'scripts/text-hygiene.mjs']) {
    assert.equal(isPhraseLensExempt(p), true, `${p} should be fully exempt`);
    assert.equal(isPhraseLensExempt(p, 'unpermissioned-claim'), true);
  }
});

test('an unlisted file is exempt from nothing', () => {
  assert.equal(isPhraseLensExempt('ops/social/posts/x/linkedin.md'), false);
  assert.equal(isPhraseLensExempt('ops/social/posts/x/linkedin.md', 'ai-vocab'), false);
});

// ---------------------------------------------------------------------------
// Assertion-shaped claim patterns.
//
// The rule (text-hygiene.mjs, above BANNED_PHRASES): match the ASSERTION, not
// the verb. A bare first-person verb is house style; a verb pointed at a client
// outcome is a claim. The negative cases below are the ones that matter - a lens
// that flags good copy gets switched off, and then it guards nothing.
// ---------------------------------------------------------------------------

const flags = (s) => detectPhrases(s).some((f) => f.category === 'unpermissioned-claim');

test('flags a first-person client outcome', () => {
  assert.ok(flags('We cut a client support backlog in half.'));
  assert.ok(flags('I reduced their customer response time.'));
});

test('flags a quantified client statement', () => {
  assert.ok(flags('A client told me it saved them 3 hours a week.'));
});

test('flags a dated client interaction', () => {
  assert.ok(flags('A client messaged me six weeks after we shipped their support bot.'));
});

test('does NOT flag a reproducible technical measurement', () => {
  // voice.md exempts measured numbers you can reproduce. A pattern keyed on
  // "cut ... by N" would flag exactly the atom content this pipeline publishes,
  // which is why the client patterns are scoped to the word client/customer.
  assert.equal(flags('I cut 18k tokens to 4k by scoping the file globs.'), false);
  assert.equal(flags('We reduced the query count from 101 to 2.'), false);
});

test('does NOT flag scene-setting, which human-voice.md requires', () => {
  assert.equal(flags('I watched the queue back up for six hours.'), false);
  assert.equal(flags('A client pinged me about it.'), false, 'no timeframe, no claim');
  assert.equal(flags('Clients tell me the same thing every time.'), false);
});

test('does NOT flag writing about the work rather than the result', () => {
  assert.equal(flags('Wrote up four of these systems in detail.'), false);
  assert.equal(flags('Most client projects start the same way.'), false);
});

test('overlapping patterns still collapse to one finding per span', () => {
  // Three patterns match the shipped-count claim. The dedupe in detectPhrases
  // keeps the count meaning "how many problems", not "how many regexes fired".
  const findings = detectPhrases("I've shipped four of these now.");
  assert.equal(findings.length, 1);
});
