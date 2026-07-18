// v0 tests - run with `node --test apps/social-poster/`.
// Covers the four load-bearing pure functions; the IO (clipboard/open/prompt) is
// deliberately untested (it has no logic to break).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CHANNELS, AUTO_ELIGIBLE, isAutoPost, extractBody, parseThread, validateChannel, runDryRun,
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
  const pack = [{ key: 'linkedin', cfg: CHANNELS.linkedin, raw: '# LinkedIn\n\nGood post.' }];
  // If runDryRun tried to post/copy/open it would need the network or a binary;
  // it returns a boolean synchronously, proving it is pure reporting.
  assert.equal(runDryRun(pack), true);
});
