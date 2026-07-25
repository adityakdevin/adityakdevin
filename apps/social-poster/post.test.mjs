// v0 tests - run with `node --test apps/social-poster/`.
// Covers the four load-bearing pure functions; the IO (clipboard/open/prompt) is
// deliberately untested (it has no logic to break).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CHANNELS, AUTO_ELIGIBLE, isAutoPost, extractBody, parseThread, validateChannel, runDryRun,
  readPlatforms, channelsForPlatforms, isPosted, markPosted, refProblems,
  readEntry, readAtom, atomProblems, factConflicts, splitPayloads, unwrap,
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

// --- atom schema (Stage 2) -------------------------------------------------
// Enforced in the pack reader, NOT validateChannel: the three fields are
// properties of the atom, while validateChannel checks one channel file against a
// character limit. A prose rule in a SKILL.md is unenforced on any run that skips
// that section, which is the whole reason this is code.

const ATOM_PACK = [
  '---', 'entry: topic', 'atom:',
  '  claim: "18k -> 4k tokens by scoping the file globs"',
  '  failure_mode: "scoping too tight drops the file the answer was in"',
  '  verification: "run it twice and diff the token count in the status line"',
  '---',
].join('\n');

test('readEntry defaults to article and recognises topic', () => {
  assert.equal(readEntry('---\npostSlug: x\n---'), 'article');
  assert.equal(readEntry(ATOM_PACK), 'topic');
  assert.equal(readEntry('no frontmatter'), 'article');
});

test('readAtom parses the nested block', () => {
  const atom = readAtom(ATOM_PACK);
  assert.equal(atom.claim, '18k -> 4k tokens by scoping the file globs');
  assert.match(atom.failure_mode, /too tight/);
  assert.match(atom.verification, /diff the token count/);
});

test('atomProblems passes a complete atom', () => {
  assert.deepEqual(atomProblems('topic', readAtom(ATOM_PACK)), []);
});

test('atomProblems ignores article-entry packs entirely', () => {
  assert.deepEqual(atomProblems('article', null), []);
});

test('atomProblems requires a NUMBER in the claim, not just a claim', () => {
  const p = atomProblems('topic', { claim: 'it uses way fewer tokens', failure_mode: 'x', verification: 'y' });
  assert.equal(p.length, 1);
  assert.match(p[0], /no number in it/);
});

test('atomProblems names each missing field', () => {
  const p = atomProblems('topic', { claim: 'cut 18k tokens' });
  assert.equal(p.length, 2);
  assert.ok(p.some((x) => /failure_mode/.test(x)));
  assert.ok(p.some((x) => /verification/.test(x)));
});

test('atomProblems catches a topic pack with no atom block at all', () => {
  const p = atomProblems('topic', null);
  assert.equal(p.length, 1);
  assert.match(p[0], /no `atom:` block/);
});

// --- cross-channel fact check ----------------------------------------------

test('factConflicts catches the exact bug that shipped (1 in 8 vs 10-15%)', () => {
  const channels = [
    { cfg: { label: 'LinkedIn' }, raw: '# LinkedIn\n\ngetting 1 in 8 answers wrong' },
    { cfg: { label: 'Reddit' }, raw: '# Reddit\n\nquietly gets 10-15% of answers wrong' },
  ];
  const c = factConflicts(channels);
  assert.equal(c.length, 1);
  assert.match(c[0], /LinkedIn cites 1in8.*Reddit cites 10-15%/);
});

test('factConflicts stays quiet when channels agree on a figure', () => {
  const channels = [
    { cfg: { label: 'LinkedIn' }, raw: '# LinkedIn\n\nabout 1 in 8 wrong' },
    { cfg: { label: 'X' }, raw: '# X\n\n1 in 8 answers, subtly wrong' },
  ];
  assert.deepEqual(factConflicts(channels), []);
});

test('factConflicts ignores channels that cite no figures', () => {
  const channels = [
    { cfg: { label: 'LinkedIn' }, raw: '# LinkedIn\n\n1 in 8 wrong' },
    { cfg: { label: 'Hacker News' }, raw: '# Hacker News\n\nShow HN: a thing' },
  ];
  assert.deepEqual(factConflicts(channels), []);
});

test('the dry run prints the exact --commit command, with the npm separator', () => {
  // `npm run post <slug> --commit` silently runs a DRY RUN: npm swallows the flag,
  // the bare slug still passes through, and the output looks like success. The fix
  // that actually sticks is the tool printing the correct string.
  const lines = [];
  const log = console.log;
  console.log = (...a) => lines.push(a.join(' '));
  try {
    runDryRun({
      channels: [{ key: 'linkedin', cfg: CHANNELS.linkedin, raw: '# LinkedIn\n\nGood post.', dir: '/x/ops/social/posts/my-slug' }],
      skipped: [],
      platforms: null,
      facts: [],
    });
  } finally {
    console.log = log;
  }
  const out = lines.join('\n');
  assert.match(out, /npm run post -- my-slug --commit/);
  assert.match(out, /"--" is required/);
});

// --- multi-payload channels -------------------------------------------------
// Reported from real use: the LinkedIn paste contained the body AND the
// "FIRST COMMENT:" URL as one blob, so the canonical link landed in the body -
// defeating the entire reason it goes in a comment. extractBody only honours a
// `---` fence when it finds a CLOSING one, and linkedin.md has a single opener.

test('LinkedIn splits into body and first comment, link OUT of the body', () => {
  const raw = [
    '# LinkedIn', '', '[ ] posted   ·   link in the FIRST COMMENT, not the body', '',
    'The body of the post.', 'Second line.', '',
    '---', 'FIRST COMMENT:', 'Full build: https://adityadev.in/blog/x?ref=li',
  ].join('\n');

  const p = splitPayloads('linkedin', raw);
  assert.equal(p.length, 2);
  assert.equal(p[0].label, 'body');
  assert.ok(!p[0].text.includes('adityadev.in'), 'the LINK must not be in the body payload');
  assert.ok(!p[0].text.includes('FIRST COMMENT'), 'the marker must not be in the body');
  assert.ok(!/-{3,}\s*$/.test(p[0].text), 'the trailing --- separator is not content');
  assert.match(p[1].label, /FIRST COMMENT/);
  assert.match(p[1].text, /https:\/\/adityadev\.in\/blog\/x\?ref=li/);
});

test('LinkedIn without a first comment stays a single paste', () => {
  const p = splitPayloads('linkedin', '# LinkedIn\n\n[ ] posted\n\nJust a body.');
  assert.equal(p.length, 1);
  assert.equal(p[0].text, 'Just a body.');
});

test('Reddit splits title from body and drops the Subreddit routing note', () => {
  const raw = [
    '# Reddit', '', '[ ] posted', 'Subreddit: r/laravel   (fallback: r/PHP)',
    'Title: The actual title', '', 'The body text.',
  ].join('\n');

  const p = splitPayloads('reddit', raw);
  assert.deepEqual(p.map((x) => x.label), ['title', 'body']);
  assert.equal(p[0].text, 'The actual title');
  assert.ok(!p[1].text.includes('Subreddit:'), 'routing note is not a payload');
  assert.ok(!p[1].text.includes('Title:'), 'the title is not repeated in the body');
});

test('Hacker News splits title from the url block', () => {
  const raw = '# Hacker News\n\n[ ] posted\nTitle: Show HN: a thing\n\nhttps://adityadev.in/blog/x?ref=hn';
  const p = splitPayloads('hackernews', raw);
  assert.deepEqual(p.map((x) => x.label), ['title', 'url + notes']);
  assert.equal(p[0].text, 'Show HN: a thing');
  assert.match(p[1].text, /\?ref=hn/);
});

test('single-payload channels are unchanged', () => {
  const p = splitPayloads('mirror', '# Mirrors\n\n[ ] posted\n\n---\nThe blurb.\n---');
  assert.equal(p.length, 1);
  assert.equal(p[0].text, 'The blurb.');
});

test('validateChannel exposes payloads, and a thread payload per tweet', () => {
  const x = validateChannel('x', '# X\n\n1/ one\n\n2/ two');
  assert.deepEqual(x.payloads.map((p) => p.label), ['1/2', '2/2']);
  const li = validateChannel('linkedin', '# LinkedIn\n\nBody.\n\n---\nFIRST COMMENT:\nhttps://adityadev.in/blog/x?ref=li');
  assert.equal(li.payloads.length, 2);
});

// --- unwrapping (reported from real use) ------------------------------------
// Channel files are hard-wrapped at ~80 cols for editing. Social composers do not
// reflow, so pasting that verbatim put a line break every ~80 chars and the post
// rendered broken. 6 paragraphs came out as 23 lines.

test('unwrap joins a hard-wrapped paragraph but keeps paragraph breaks', () => {
  const wrapped = 'This is a long line that was\nwrapped at eighty columns for\nediting.\n\nA second paragraph.';
  assert.equal(unwrap(wrapped), 'This is a long line that was wrapped at eighty columns for editing.\n\nA second paragraph.');
});

test('unwrap preserves list items - the break IS the content there', () => {
  const md = 'Intro line\nkeeps going.\n\n- first bullet\n- second bullet';
  assert.equal(unwrap(md), 'Intro line keeps going.\n\n- first bullet\n- second bullet');
});

test('unwrap leaves fenced code exactly alone', () => {
  const md = 'Before.\n\n```php\n$a = 1;\n$b = 2;\n```\n\nAfter.';
  assert.equal(unwrap(md), md);
});

test('unwrap leaves indented code alone', () => {
  const md = 'Look:\n\n    ->where(1)\n    ->first();';
  assert.equal(unwrap(md), md);
});

test('the LinkedIn body payload arrives unwrapped', () => {
  const raw = [
    '# LinkedIn', '', '[ ] posted', '',
    'A paragraph that was hard wrapped', 'across two lines in the file.', '',
    '---', 'FIRST COMMENT:', 'https://adityadev.in/blog/x?ref=li',
  ].join('\n');
  const [body] = splitPayloads('linkedin', raw);
  assert.equal(body.text, 'A paragraph that was hard wrapped across two lines in the file.');
  assert.ok(!body.text.includes('\n'), 'a single paragraph must be a single line');
});
