// v1a tests - run with `node --test apps/infographic/`.
// Cover the load-bearing pure logic: the validator (the correctness gate), the
// HTML escaping, template output, and the PNG-size check. Browser IO is untested
// (no logic to break; it is exercised by a live render).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validate, BOUNDS, LAYOUTS } from './schema.mjs';
import { esc, fillTemplate } from './templates.mjs';
import { pngSize } from './render.mjs';
import { statusColor, BRAND } from './tokens.mjs';
import { slugify, extractJson, buildPrompt, shapeFor, draftInfographic, resolveProvider } from './draft.mjs';

const FONTS = { fontRegular: '/x/reg.ttf', fontSemibold: '/x/semi.ttf' };
const goodTable = {
  layout: 'table', chip: 'CACHE COMPARE', title: 'Redis vs Memcached',
  columns: ['Aspect', 'Redis', 'Memcached'],
  rows: [['Data types', 'Rich structures', 'Strings only'], ['Max value', '512 MB', '1 MB default']],
};

test('validate accepts a clean table', () => {
  assert.deepEqual(validate('table', goodTable).problems, []);
});

test('validate rejects an unknown layout', () => {
  assert.match(validate('pie', {}).problems[0], /unknown layout/);
});

test('validate requires a non-empty title', () => {
  const { problems } = validate('table', { ...goodTable, title: '  ' });
  assert.ok(problems.some((p) => /title/.test(p)));
});

test('validate rejects too many rows', () => {
  const rows = Array.from({ length: BOUNDS.table.maxRows + 1 }, (_, i) => [`a${i}`, 'b', 'c']);
  const { problems } = validate('table', { ...goodTable, rows });
  assert.ok(problems.some((p) => /rows >/.test(p)));
});

test('validate rejects a wrong-width row', () => {
  const { problems } = validate('table', { ...goodTable, rows: [['only', 'two']] });
  assert.ok(problems.some((p) => /exactly 3 cells/.test(p)));
});

test('validate rejects an over-long cell (trim, not shrink)', () => {
  const long = 'x'.repeat(BOUNDS.table.maxCell + 1);
  const { problems } = validate('table', { ...goodTable, rows: [['ok', long, 'ok']] });
  assert.ok(problems.some((p) => /trim it/.test(p)));
});

test('validate rejects an empty cell', () => {
  const { problems } = validate('table', { ...goodTable, rows: [['label', '', 'ok']] });
  assert.ok(problems.some((p) => /is empty/.test(p)));
});

test('validate knows the other layouts (shape-checks them)', () => {
  assert.deepEqual(LAYOUTS, ['table', 'grid', 'cheatsheet', 'diagram', 'fix']);
  assert.ok(validate('grid', { title: 'x', cells: [] }).problems.some((p) => /at least 1 cell/.test(p)));
  assert.ok(validate('cheatsheet', { title: 'x', sections: [] }).problems.some((p) => /at least 1 section/.test(p)));
  assert.ok(validate('diagram', { title: 'x', satellites: [] }).problems.some((p) => /at least 1 satellite/.test(p)));
});

test('esc neutralizes HTML-significant chars', () => {
  assert.equal(esc('<script>&"\''), '&lt;script&gt;&amp;&quot;&#39;');
});

test('fillTemplate renders the title and every cell, escaped', () => {
  const html = fillTemplate('table', { ...goodTable, title: 'A<b>', rows: [['x&y', 'v', 'w']] }, FONTS);
  assert.ok(html.includes('A&lt;b&gt;'));
  assert.ok(html.includes('x&amp;y'));
  assert.ok(html.includes('file:///x/reg.ttf'));
  assert.ok(!html.includes('<b>'), 'raw HTML from data must not leak through');
});

test('fillTemplate renders a grid with status-colored cells', () => {
  const data = { layout: 'grid', title: 'HTTP Codes', cells: [
    { code: '200', label: 'OK', desc: 'Success' },
    { code: '404', label: 'Not Found', desc: '<x> missing' },
  ] };
  const html = fillTemplate('grid', data, FONTS);
  assert.ok(html.includes('>200<'));
  assert.ok(html.includes(`--gc:${BRAND.accent.green}`), '2xx cell is green');
  assert.ok(html.includes(`--gc:${BRAND.accent.amber}`), '4xx cell is amber');
  assert.ok(html.includes('&lt;x&gt; missing'), 'desc is escaped');
});

test('fillTemplate renders a cheatsheet with rotating section accents', () => {
  const data = { layout: 'cheatsheet', title: 'SQL', sections: [
    { title: 'CTE', lines: ['WITH x AS (...)'] },
    { title: 'Joins', lines: ['INNER / LEFT <a>'] },
  ] };
  const html = fillTemplate('cheatsheet', data, FONTS);
  assert.ok(html.includes(`--sc:${BRAND.accent.cyan}`), 'section 1 cyan');
  assert.ok(html.includes(`--sc:${BRAND.accent.amber}`), 'section 2 amber');
  assert.ok(html.includes('INNER / LEFT &lt;a&gt;'), 'lines escaped');
});

test('fillTemplate renders a diagram: center, satellites, and a line each', () => {
  const data = { layout: 'diagram', title: 'My Stack', center: 'Me', satellites: ['A<x>', 'B', 'C'] };
  const html = fillTemplate('diagram', data, FONTS);
  assert.ok(html.includes('dnode center'));
  assert.ok(html.includes('>Me<'));
  assert.ok(html.includes('A&lt;x&gt;'), 'satellite label escaped');
  assert.equal((html.match(/<line /g) || []).length, 3, 'one connector line per satellite');
});

test('fillTemplate throws for an unknown layout', () => {
  assert.throws(() => fillTemplate('pie', {}, FONTS), /not a known layout/);
});

test('carousel pager shows N/total + dots only when total > 1', () => {
  const paged = fillTemplate('table', goodTable, { ...FONTS, page: { index: 0, total: 5 } });
  assert.ok(paged.includes('1 / 5'), 'shows the counter');
  assert.equal((paged.match(/<span class="dot/g) || []).length, 5, '5 dots for 5 slides');
  const single = fillTemplate('table', goodTable, FONTS);
  assert.ok(!single.includes('class="counter"'), 'single card: no counter');
  assert.ok(!single.includes('class="dots"'), 'single card: no dots');
});

test('pngSize reads width/height from IHDR', () => {
  const buf = Buffer.alloc(24);
  buf.write('IHDR', 12, 'ascii');
  buf.writeUInt32BE(1080, 16);
  buf.writeUInt32BE(1350, 20);
  assert.deepEqual(pngSize(buf), { w: 1080, h: 1350 });
});

test('statusColor maps HTTP ranges to brand accents', () => {
  assert.equal(statusColor(204), BRAND.accent.green);
  assert.equal(statusColor(301), BRAND.accent.cyan);
  assert.equal(statusColor(404), BRAND.accent.amber);
  assert.equal(statusColor(503), BRAND.accent.red);
});

// ---- draft (v1b) ----

test('slugify makes a safe filename slug', () => {
  assert.equal(slugify('Redis vs Memcached!'), 'redis-vs-memcached');
  assert.equal(slugify('   '), 'infographic');
});

test('extractJson handles fenced and bare JSON', () => {
  assert.deepEqual(extractJson('```json\n{"a":1}\n```'), { a: 1 });
  assert.deepEqual(extractJson('here you go: {"b":2} thanks'), { b: 2 });
  assert.throws(() => extractJson('no json here'), /no JSON object/);
});

test('buildPrompt embeds layout bounds and retry errors', () => {
  assert.match(buildPrompt('X', 'table'), /exactly 3 columns/);
  assert.match(buildPrompt('X', 'table', ['row 1 cell 2 empty']), /failed validation/);
  assert.match(shapeFor('grid'), /cells/);
});

// Fake fetch that replays queued reply strings as API responses.
function fakeFetch(replies) {
  let i = 0;
  return async () => ({
    ok: true, status: 200,
    text: async () => '', json: async () => ({ content: [{ type: 'text', text: replies[i++] }] }),
  });
}

test('draftInfographic returns valid data on first good reply', async () => {
  const good = JSON.stringify({ layout: 'table', title: 'A vs B', columns: ['Aspect', 'A', 'B'], rows: [['x', 'a', 'b']] });
  const data = await draftInfographic('t', 'table', { apiKey: 'k', fetchImpl: fakeFetch([good]) });
  assert.equal(data.title, 'A vs B');
});

test('draftInfographic retries once on an invalid draft, then succeeds (the gate)', async () => {
  const bad = JSON.stringify({ layout: 'table', title: '', columns: ['a', 'b'], rows: [] });
  const good = JSON.stringify({ layout: 'table', title: 'Ok', columns: ['Aspect', 'A', 'B'], rows: [['x', 'a', 'b']] });
  const data = await draftInfographic('t', 'table', { apiKey: 'k', fetchImpl: fakeFetch([bad, good]) });
  assert.equal(data.title, 'Ok');
});

test('draftInfographic throws if still invalid after the retry', async () => {
  const bad = JSON.stringify({ layout: 'table', title: '', columns: ['a'], rows: [] });
  await assert.rejects(
    draftInfographic('t', 'table', { apiKey: 'k', fetchImpl: fakeFetch([bad, bad]) }),
    /still invalid after retry/,
  );
});

test('draftInfographic (api provider) refuses without an API key', async () => {
  await assert.rejects(draftInfographic('t', 'table', { provider: 'api', apiKey: '' }), /ANTHROPIC_API_KEY/);
});

test('resolveProvider honors an explicit choice', () => {
  assert.equal(resolveProvider('codex'), 'codex');
  assert.equal(resolveProvider('api'), 'api');
  // auto-detect returns one of the known providers
  assert.ok(['claude', 'codex', 'api'].includes(resolveProvider()));
});

// --- post kit (S1.5): staging for BOTH image pipelines -----------------------
// These were the untested filesystem functions; they now use a real temp tree
// rather than mocks, because the bug they guard against is a filename mismatch.

import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, basename } from 'node:path';
import { findPngs, findSlides, postKit } from './post.mjs';

function fixture(slug, files) {
  const root = mkdtempSync(join(tmpdir(), 'infographic-test-'));
  const dir = join(root, 'ops', 'social', 'posts', slug);
  mkdirSync(join(dir, 'assets'), { recursive: true });
  for (const [name, body] of Object.entries(files)) {
    const p = name.startsWith('assets/') ? join(dir, name) : join(dir, name);
    writeFileSync(p, body ?? '');
  }
  return { root, dir };
}

test('findSlides picks up blog-carousel PNGs in natural order', () => {
  const { dir } = fixture('post', {
    'assets/slide-1-hook.png': '', 'assets/slide-2-problem.png': '',
    'assets/slide-10-cta.png': '',
  });
  const got = findSlides(join(dir, 'assets')).map((p) => basename(p));
  assert.deepEqual(got, ['slide-1-hook.png', 'slide-2-problem.png', 'slide-10-cta.png']);
});

test('findPngs does NOT match blog slides (they belong to the other pipeline)', () => {
  const { dir } = fixture('my-topic', { 'assets/slide-1-hook.png': '' });
  assert.deepEqual(findPngs(join(dir, 'assets'), 'my-topic'), []);
});

test('findSlides does NOT match infographic output', () => {
  const { dir } = fixture('my-topic', { 'assets/my-topic-table.png': '' });
  assert.deepEqual(findSlides(join(dir, 'assets')), []);
});

test('postKit stages a blog carousel and reads its caption from instagram-facebook.md', () => {
  // Blog packs have no caption.txt - it exists in 1 of 9 shipped pack dirs.
  const { root } = fixture('blog-post', {
    'assets/slide-1-hook.png': '', 'assets/slide-2-problem.png': '',
    'instagram-facebook.md': '# Instagram / Facebook\nCaption: The real caption here.  ?ref=ig\n',
  });
  const kit = postKit('blog-post', root);
  assert.equal(kit.pngs.length, 2);
  assert.equal(kit.caption, 'The real caption here.  ?ref=ig');
});

test('postKit prefers caption.txt when present', () => {
  const { root } = fixture('topic', {
    'assets/topic-table.png': '',
    'caption.txt': 'From caption.txt',
    'instagram-facebook.md': 'Caption: from the media file\n',
  });
  assert.equal(postKit('topic', root).caption, 'From caption.txt');
});

test('postKit refuses to guess when a pack holds BOTH kinds', () => {
  const { root } = fixture('both', {
    'assets/both-table.png': '', 'assets/slide-1-hook.png': '',
  });
  assert.throws(() => postKit('both', root), /Pick one: --infographic or --slides/);
  // ...but an explicit kind resolves it.
  assert.equal(postKit('both', root, { kind: 'slides' }).pngs.length, 1);
  assert.equal(postKit('both', root, { kind: 'infographic' }).pngs.length, 1);
});

test('postKit names both render commands when nothing is rendered', () => {
  const { root } = fixture('empty', {});
  assert.throws(() => postKit('empty', root), /render\.mjs empty[\s\S]*social-card empty/);
});

// --- the "fix" layout -------------------------------------------------------
// Added after four real LinkedIn posts showed the pattern: the ones that travel
// are TEACHING artifacts (605, 620, 145 reactions) and the one that died was a
// polished self-promo mockup (4). The strongest technical one was a mistake-vs-fix
// comparison whose entire payload was a measured before/after.

test('fix layout accepts a complete comparison', () => {
  const { problems } = validate('fix', {
    title: 'N+1',
    wrong: { label: 'the mistake', code: 'Post::all()', metric: '101 queries' },
    right: { label: 'the fix', code: 'with()->get()', metric: '2 queries' },
  });
  assert.deepEqual(problems, []);
});

test('fix layout rejects a ONE-SIDED number', () => {
  // A metric on one side only is an assertion dressed as a comparison.
  const { problems } = validate('fix', {
    title: 'N+1',
    wrong: { label: 'the mistake', code: 'Post::all()', metric: '101 queries' },
    right: { label: 'the fix', code: 'with()' },
  });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /BOTH sides a metric/);
});

test('fix layout allows neither side having a metric', () => {
  const { problems } = validate('fix', {
    title: 'A',
    wrong: { label: 'x', code: 'a()' },
    right: { label: 'y', code: 'b()' },
  });
  assert.deepEqual(problems, []);
});

test('fix layout rejects code that would wrap mid-token', () => {
  // The metric chip is deliberately large (the number IS the payload), leaving the
  // code box ~490px. Past 34 chars it wraps, and a break landing mid-token reads as
  // a typo in the code itself.
  const long = "foreach (Post::with('author')->get() as $p) { $p->author->name; }";
  const { problems } = validate('fix', {
    title: 'A',
    wrong: { label: 'x', code: long },
    right: { label: 'y', code: 'b()' },
  });
  assert.ok(problems.some((p) => /wrong\.code/.test(p) && /34 limit/.test(p)));
});

test('fix layout requires both sides to exist', () => {
  const { problems } = validate('fix', { title: 'A', wrong: { label: 'x', code: 'a()' } });
  assert.ok(problems.some((p) => /needs a "right" object/.test(p)));
});

test('fix is a known layout', () => {
  assert.ok(LAYOUTS.includes('fix'));
});
