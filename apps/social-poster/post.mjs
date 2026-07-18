#!/usr/bin/env node
// social-poster v0 - local CLI, zero API posting.
// Reads ops/social/posts/<slug>/*.md, validates, then (on --commit) copies each
// platform's text to the clipboard and opens its composer for you to paste+post.
// v0.2 will add Bluesky+Mastodon auto-posting behind --commit; the AUTO_ELIGIBLE
// guard below already forbids LinkedIn/Reddit from ever being auto-posted.
//
// Usage:
//   node apps/social-poster/post.mjs <slug>            # dry-run (default): validate only
//   node apps/social-poster/post.mjs <slug> --commit   # clipboard + open composer per channel
//
// ponytail: no deps. pbcopy/open are macOS; wrappers no-op with a warning elsewhere.

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline';

// One entry per postable pack file. `limit` is the per-post (per-thread-segment)
// character cap for the tightest platform the file feeds.
export const CHANNELS = {
  linkedin:   { file: 'linkedin.md',    label: 'LinkedIn',                  limit: 3000,  composer: 'https://www.linkedin.com/feed/',        thread: false },
  x:          { file: 'x.md',           label: 'X',                         limit: 280,   composer: 'https://x.com/compose/post',            thread: true  },
  reddit:     { file: 'reddit.md',      label: 'Reddit',                    limit: 40000, composer: 'https://www.reddit.com/submit',         thread: false },
  mirror:     { file: 'mirror.md',      label: 'Bluesky / Mastodon / Threads', limit: 300, composer: 'https://bsky.app',                    thread: false },
  // HN pack is title + url + notes, not one field (the 80-char cap is the title,
  // which you set on the submit form). No single length gate applies; copy it all.
  hackernews: { file: 'hackernews.md',  label: 'Hacker News',               limit: 40000, composer: 'https://news.ycombinator.com/submit',  thread: false },
};

// v0.2 auto-post targets. LinkedIn (#1 lead channel) and Reddit (spam/ban risk)
// are deliberately absent and must stay that way - post.test.mjs asserts it.
export const AUTO_ELIGIBLE = new Set(['bluesky', 'mastodon']);

// v0 never auto-posts anything. Kept as a function so v0.2 flips one place.
export function isAutoPost(/* channelKey */) {
  return false;
}

// Strip the leading "# Heading" and editorial/metadata lines so what lands on the
// clipboard is the post text, not the pack's bookkeeping. If the file wraps its
// canonical text in a `---` fence (mirror.md), that fenced block wins.
export function extractBody(raw) {
  const lines = raw.replace(/\r\n/g, '\n').split('\n');

  // Prefer the first `---`...`---` fenced block if present.
  const firstFence = lines.findIndex((l) => l.trim() === '---');
  if (firstFence !== -1) {
    const secondFence = lines.findIndex((l, i) => i > firstFence && l.trim() === '---');
    if (secondFence !== -1) {
      return lines.slice(firstFence + 1, secondFence).join('\n').trim();
    }
  }

  const kept = lines.filter((l, i) => {
    if (i === 0 && /^#{1,6}\s/.test(l)) return false;       // top heading
    if (/^#{1,6}\s/.test(l)) return false;                  // any markdown heading
    if (/^\[.*\]/.test(l.trim())) return false;             // [ ] posted / [v2: ...]
    if (/^\(.*rules?.*\)/i.test(l.trim())) return false;    // (rules check ...) note
    return true;
  });

  return kept.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

// Split a numbered thread ("1/\n...\n\n2/\n...") into segments. No numbering ->
// a single segment. Fails loudly on gaps or duplicates so a malformed draft never
// silently posts a broken thread.
export function parseThread(body) {
  const lines = body.replace(/\r\n/g, '\n').split('\n');
  const marker = /^(\d+)\/\s*$/;
  if (!lines.some((l) => marker.test(l.trim()))) return [body.trim()];

  const segments = [];
  const seen = [];
  let current = null;
  for (const line of lines) {
    const m = line.trim().match(marker);
    if (m) {
      seen.push(Number(m[1]));
      if (current !== null) segments.push(current.trim());
      current = '';
    } else if (current !== null) {
      current += line + '\n';
    }
  }
  if (current !== null) segments.push(current.trim());

  for (let i = 0; i < seen.length; i++) {
    if (seen[i] !== i + 1) {
      throw new Error(`thread numbering not contiguous: expected ${i + 1}/, saw ${seen[i]}/ (got [${seen.join(', ')}])`);
    }
  }
  return segments.filter((s) => s.length > 0);
}

// Validate one channel's extracted content. Returns an array of problem strings
// (empty === OK). This is the whole of what --dry-run checks.
export function validateChannel(key, raw) {
  const cfg = CHANNELS[key];
  const problems = [];
  const body = extractBody(raw);
  if (!body) {
    problems.push(`${cfg.label}: empty after stripping metadata`);
    return { problems, segments: [] };
  }
  let segments;
  try {
    segments = cfg.thread ? parseThread(body) : [body];
  } catch (err) {
    problems.push(`${cfg.label}: ${err.message}`);
    return { problems, segments: [] };
  }
  segments.forEach((seg, i) => {
    if (seg.length > cfg.limit) {
      const where = cfg.thread ? ` segment ${i + 1}/${segments.length}` : '';
      problems.push(`${cfg.label}:${where} ${seg.length} chars > ${cfg.limit} limit`);
    }
  });
  return { problems, segments };
}

export function readPack(slug, root = process.cwd()) {
  const dir = join(root, 'ops', 'social', 'posts', slug);
  if (!existsSync(dir)) throw new Error(`no pack directory: ${dir}`);
  const found = [];
  for (const [key, cfg] of Object.entries(CHANNELS)) {
    const path = join(dir, cfg.file);
    if (existsSync(path)) found.push({ key, cfg, raw: readFileSync(path, 'utf8'), dir });
  }
  if (found.length === 0) throw new Error(`no postable .md files in ${dir}`);
  return found;
}

// ---- side-effecting IO (thin, not unit-tested; exercised only under --commit) ----

function copyToClipboard(text) {
  if (process.platform !== 'darwin') {
    console.warn('  (clipboard copy skipped - pbcopy is macOS only)');
    return;
  }
  spawnSync('pbcopy', [], { input: text });
}

function openUrl(url) {
  if (process.platform !== 'darwin') {
    console.warn(`  (open skipped - visit ${url})`);
    return;
  }
  spawnSync('open', [url]);
}

function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (a) => { rl.close(); resolve(a); }));
}

// ---- runners ----

export function runDryRun(pack) {
  let anyProblem = false;
  console.log('DRY RUN (default) - validating, posting nothing.\n');
  for (const { key, cfg, raw } of pack) {
    const { problems, segments } = validateChannel(key, raw);
    const shape = cfg.thread ? `${segments.length} segments` : `${(segments[0] || '').length} chars`;
    if (problems.length) {
      anyProblem = true;
      console.log(`  [FAIL] ${cfg.label} (${shape})`);
      for (const p of problems) console.log(`      ${p}`);
    } else {
      console.log(`  [ok]   ${cfg.label} (${shape}) -> composer: ${cfg.composer}`);
    }
  }
  console.log(anyProblem
    ? '\nProblems found. Fix the packs above, then re-run with --commit.'
    : '\nAll channels valid. Re-run with --commit to copy + open composers.');
  return !anyProblem;
}

async function runCommit(pack) {
  console.log('COMMIT (v0) - copy text + open composer per channel. You paste + post.\n');
  const done = [];
  for (const { key, cfg, raw } of pack) {
    const { problems, segments } = validateChannel(key, raw);
    if (problems.length) {
      console.log(`  [skip] ${cfg.label} skipped (validation): ${problems[0]}`);
      continue;
    }
    const text = cfg.thread ? segments.join('\n\n---\n\n') : segments[0];
    copyToClipboard(text);
    openUrl(cfg.composer);
    const a = (await ask(`  ${cfg.label}: text copied, composer opened. [Enter]=posted, s=skip: `)).trim().toLowerCase();
    done.push({ channel: cfg.label, posted: a !== 's' });
  }
  console.log('\nSummary:');
  for (const d of done) console.log(`  ${d.posted ? '[posted] ' : '[skipped]'}  ${d.channel}`);
}

async function main() {
  const args = process.argv.slice(2);
  const slug = args.find((a) => !a.startsWith('-'));
  const commit = args.includes('--commit');
  if (!slug) {
    console.error('usage: node apps/social-poster/post.mjs <slug> [--commit]');
    process.exit(1);
  }
  let pack;
  try {
    pack = readPack(slug);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
  if (commit) await runCommit(pack);
  else runDryRun(pack);
}

// Only run when invoked directly, not when imported by tests.
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
