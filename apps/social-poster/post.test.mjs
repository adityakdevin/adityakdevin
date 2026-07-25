// v0 tests - run with `node --test apps/social-poster/`.
// Covers the four load-bearing pure functions; the IO (clipboard/open/prompt) is
// deliberately untested (it has no logic to break).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CHANNELS, AUTO_ELIGIBLE, isAutoPost, extractBody, parseThread, validateChannel, runDryRun,
  readPlatforms, channelsForPlatforms, isPosted, markPosted, refProblems,
} from './post.mjs';

test('CRITICAL: LinkedIn and Reddit can never be auto-posted', () => {
  assert.ok(!AUTO_ELIGIBLE.has('linkedin'), 'linkedin must not be auto-eligible');
  assert.ok(!AUTO_ELIGIBLE.has('reddit'), 'reddit must not be auto-eligible');
  // v0 auto-posts nothing at all.
  for (const key of Object.keys(CHANNELS)) {
    assert.equal(isAutoPost(key), false, `${key} must not auto-post in v0`);
  }
});

test('parseThread splits numbered threads', () => {
  assert.deepEqual(parseThread('1/\naaa\n\n2/\nbbb'), ['aaa', 'bbb']);
});

test('parseThread returns single segment when unnumbered', () => {
  assert.deepEqual(parseThread('just one post'), ['just one post']);
});

test('parseThread handles two-digit numbering', () => {
  const body = Array.from({ length: 11 }, (_, i) => `${i + 1}/\nseg${i + 1}`).join('\n\n');
  assert.deepEqual(parseThread(body).length, 11);
});

test('parseThread fails loudly on a numbering gap', () => {
  assert.throws(() => parseThread('1/\na\n\n3/\nc'), /not contiguous/);
});

test('parseThread handles CRLF line endings', () => {
  assert.deepEqual(parseThread('1/\r\naaa\r\n\r\n2/\r\nbbb'), ['aaa', 'bbb']);
});

test('extractBody strips heading and [ ] metadata', () => {
  const raw = '# LinkedIn\n\n[ ] posted\n[v2: note]\n\nReal body here.';
  assert.equal(extractBody(raw), 'Real body here.');
});

test('extractBody prefers a --- fenced block (mirror.md shape)', () => {
  const raw = '# Mirrors\n\n[ ] posted\n\n---\nThe mirror text.\n---\n\nPer platform notes.';
  assert.equal(extractBody(raw), 'The mirror text.');
});

test('validateChannel flags over-limit content', () => {
  const raw = '# Bluesky\n\n---\n' + 'x'.repeat(301) + '\n---';
  const { problems } = validateChannel('mirror', raw);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /301 chars > 300 limit/);
});

test('validateChannel flags empty content', () => {
  const { problems } = validateChannel('linkedin', '# LinkedIn\n\n[ ] posted\n');
  assert.match(problems[0], /empty/);
});

test('validateChannel passes clean content', () => {
  const { problems } = validateChannel('linkedin', '# LinkedIn\n\n[ ] posted\n\nA short valid post.');
  assert.deepEqual(problems, []);
});

test('runDryRun performs no IO and returns validity', () => {
  const pack = {
    channels: [{ key: 'linkedin', cfg: CHANNELS.linkedin, raw: '# LinkedIn\n\nGood post.' }],
    skipped: [],
    platforms: null,
  };
  // If runDryRun tried to post/copy/open it would need the network or a binary;
  // it returns a boolean synchronously, proving it is pure reporting.
  assert.equal(runDryRun(pack), true);
});

// --- platforms: filter (S1.9) ---------------------------------------------

test('readPlatforms parses a flow sequence without choking on inline objects', () => {
  // The inline `refs: { ... }` object is exactly what a naive YAML split mangles.
  const pack = [
    '---',
    'postSlug: x',
    'refs: { ig: ig, facebook: fb }',
    'platforms: [linkedin, x]',
    '---',
  ].join('\n');
  assert.deepEqual(readPlatforms(pack), ['linkedin', 'x']);
});

test('readPlatforms returns null when the key is absent (means NO FILTER)', () => {
  // Only 1 of 3 shipped packs has platforms:. Defaulting to "none" would make the
  // tool silently post nothing for the other two.
  assert.equal(readPlatforms('---\npostSlug: x\n---'), null);
  assert.equal(readPlatforms('no frontmatter at all'), null);
});

test('channelsForPlatforms maps aliases and drops image/email platforms', () => {
  const keys = channelsForPlatforms(['linkedin', 'hn', 'bluesky', 'ig', 'newsletter']);
  assert.deepEqual([...keys].sort(), ['hackernews', 'linkedin', 'mirror']);
});

test('channelsForPlatforms accepts "mirror" (the shape the shipped packs use)', () => {
  // streaming-ai-responses' pack.md says `platforms: [linkedin, x, reddit, mirror,
  // newsletter]` - the file name, not the three platform names. Skipping it here
  // silently dropped a channel the pack explicitly asked for.
  const keys = channelsForPlatforms(['linkedin', 'x', 'reddit', 'mirror', 'newsletter']);
  assert.deepEqual([...keys].sort(), ['linkedin', 'mirror', 'reddit', 'x']);
});

test('channelsForPlatforms ignores an unknown name rather than failing', () => {
  const keys = channelsForPlatforms(['linkedin', 'tiktok']);
  assert.deepEqual([...keys], ['linkedin']);
});

test('channelsForPlatforms returns null for null (no filter, not empty set)', () => {
  assert.equal(channelsForPlatforms(null), null);
});

// --- posted state (S1.6) ---------------------------------------------------

test('isPosted distinguishes ticked from unticked', () => {
  assert.equal(isPosted('# X\n\n[ ] posted\n\nbody'), false);
  assert.equal(isPosted('# X\n\n[x] posted\n\nbody'), true);
  assert.equal(isPosted('# X\n\nno marker'), false);
});

test('markPosted ticks the box and leaves the body alone', () => {
  const raw = '# LinkedIn\n\n[ ] posted   ·   founder-facing\n\nThe body.';
  const out = markPosted(raw);
  assert.ok(out.includes('[x] posted   ·   founder-facing'));
  assert.ok(out.includes('The body.'));
  assert.equal(isPosted(out), true);
});

test('markPosted returns null when there is no marker to tick', () => {
  assert.equal(markPosted('# X\n\nbody only'), null);
});

test('the ticked marker never reaches the clipboard', () => {
  // extractBody strips [..] lines, so ticking is invisible to the paste.
  assert.equal(extractBody(markPosted('# X\n\n[ ] posted\n\nBody.')), 'Body.');
});

// --- ?ref validation (S1.9) -----------------------------------------------

test('refProblems flags a missing ref', () => {
  const p = refProblems('X', 'read it https://adityadev.in/blog/thing');
  assert.equal(p.length, 1);
  assert.match(p[0], /no \?ref=/);
});

test('refProblems flags an uppercase ref (track.ts is case-sensitive)', () => {
  const p = refProblems('Mirror', 'https://adityadev.in/blog/thing?ref=Bsky');
  assert.equal(p.length, 1);
  assert.match(p[0], /must be lowercase/);
});

test('refProblems passes a correct lowercase ref', () => {
  assert.deepEqual(refProblems('X', 'https://adityadev.in/blog/thing?ref=x'), []);
});

test('refProblems ignores bodies with no adityadev.in link (hackernews title-only)', () => {
  assert.deepEqual(refProblems('Hacker News', 'Show HN: a thing I built'), []);
});

test('validateChannel now surfaces ref problems too', () => {
  const { problems } = validateChannel('linkedin', '# LinkedIn\n\nSee https://adityadev.in/blog/x');
  assert.equal(problems.length, 1);
  assert.match(problems[0], /no \?ref=/);
});

test('parseThread handles INLINE numbering (the shape that parsed as one segment)', () => {
  // building-ai-agents' x.md numbers as "1/ text" rather than "1/\ntext". The
  // marker-alone-only regex matched nothing, so the whole 1718-char thread came
  // back as a single segment and the 280-char per-tweet check never ran on it.
  const body = '1/ first tweet\n\n2/ second tweet\n\n3/ third tweet';
  assert.deepEqual(parseThread(body), ['first tweet', 'second tweet', 'third tweet']);
});

test('parseThread handles inline numbering with continuation lines', () => {
  const body = '1/ opener\ncontinues here\n\n2/ second';
  assert.deepEqual(parseThread(body), ['opener\ncontinues here', 'second']);
});

test('parseThread still handles the marker-alone shape, and mixtures', () => {
  assert.deepEqual(parseThread('1/\naaa\n\n2/ bbb'), ['aaa', 'bbb']);
});

test('parseThread still fails loudly on a gap with inline numbering', () => {
  assert.throws(() => parseThread('1/ a\n\n3/ c'), /not contiguous/);
});
