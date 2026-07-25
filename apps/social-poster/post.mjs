#!/usr/bin/env node
// social-poster v0 - local CLI, zero API posting.
// Reads ops/social/posts/<slug>/*.md, validates, then (on --commit) copies each
// platform's text to the clipboard and opens its composer for you to paste+post.
// v0.2 will add Bluesky+Mastodon auto-posting behind --commit; the AUTO_ELIGIBLE
// guard below already forbids LinkedIn/Reddit from ever being auto-posted.
//
// Usage:
//   node apps/social-poster/post.mjs <slug>            # dry-run (default): validate only
//   node apps/social-poster/post.mjs <slug> --commit   # clipboard + open composer, one prompt per segment
//   node apps/social-poster/post.mjs <slug> --force    # re-offer channels already marked [x] posted
//
// Threads prompt PER SEGMENT (an 8-tweet thread is 8 prompts, not one blob), only
// channels listed in pack.md's `platforms:` are offered, and each posted channel
// gets its `[ ] posted` line ticked so a session spread over hours can resume.
//
// ponytail: no deps. pbcopy/open are macOS; wrappers no-op with a warning elsewhere.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
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
//
// NOTE: no CHANNELS key matches either entry, so this set is currently INERT.
// It becomes live the day `mirror` is split into bluesky/mastodon/threads
// entries - which is deferred until those accounts actually exist
// (ops/social/social-setup.md still has blank profile rows for both). Whoever
// does that split must extend the never-auto-post test to the new keys.
export const AUTO_ELIGIBLE = new Set(['bluesky', 'mastodon']);

// pack.md `platforms:` names are the human-facing channel list; CHANNELS keys are
// the FILES that feed them. One file can serve three platforms (mirror.md), and
// some platforms have no text file at all (a carousel is not a .md).
const PLATFORM_TO_CHANNEL = {
  linkedin: 'linkedin',
  x: 'x',
  twitter: 'x',
  reddit: 'reddit',
  hn: 'hackernews',
  hackernews: 'hackernews',
  bluesky: 'mirror',
  bsky: 'mirror',
  mastodon: 'mirror',
  masto: 'mirror',
  threads: 'mirror',
  // The shipped packs write the FILE name here, not the platform names - keep both
  // shapes working rather than silently skipping a channel the pack asked for.
  mirror: 'mirror',
  mirrors: 'mirror',
  // Deliberately mapped to nothing: these ship as images or email, not pack text.
  ig: null,
  instagram: null,
  facebook: null,
  fb: null,
  newsletter: null,
  nl: null,
};

// The frontmatter block, as lines. NOT a YAML parser - pack.md contains inline
// objects (`refs: { ig: ig, facebook: fb }`) that a naive parser mangles, and we
// only ever need a handful of scalar keys plus one flow sequence.
export function frontmatterLines(packRaw) {
  const lines = String(packRaw ?? '').replace(/\r\n/g, '\n').split('\n');
  if (lines[0]?.trim() !== '---') return null;
  const end = lines.findIndex((l, i) => i > 0 && l.trim() === '---');
  return lines.slice(1, end === -1 ? lines.length : end);
}

const unquote = (s) => s.trim().replace(/^["']|["']$/g, '').trim();

// article (default) = built from a published canonical post.
// topic = an atom that ships without an article, per the two-entry-point decision.
export function readEntry(packRaw) {
  const front = frontmatterLines(packRaw);
  const line = front?.find((l) => /^entry:/.test(l.trim()));
  if (!line) return 'article';
  const v = unquote(line.split(':').slice(1).join(':')).toLowerCase();
  return v === 'topic' ? 'topic' : 'article';
}

// The atom block:
//   atom:
//     claim: "18k -> 4k tokens by scoping the file globs"
//     failure_mode: "..."
//     verification: "..."
export function readAtom(packRaw) {
  const front = frontmatterLines(packRaw);
  if (!front) return null;
  const start = front.findIndex((l) => /^atom:\s*$/.test(l.trim()));
  if (start === -1) return null;
  const atom = {};
  for (let i = start + 1; i < front.length; i++) {
    const line = front[i];
    if (!/^\s+\S/.test(line)) break; // dedent ends the block
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    atom[line.slice(0, idx).trim()] = unquote(line.slice(idx + 1));
  }
  return atom;
}

// The three required fields, enforced in CODE rather than as prose in a SKILL.md.
// This is the one differentiator the research found a tech audience measurably
// wants and that a generic AI-tips account structurally cannot fake: content that
// required having actually run the thing. A style note would not survive contact
// with a hurried draft; a throw does.
export function atomProblems(entry, atom) {
  if (entry !== 'topic') return [];
  if (!atom) return ['topic entry: no `atom:` block in pack.md (needs claim, failure_mode, verification)'];
  const problems = [];
  if (!atom.claim) problems.push('atom.claim is missing (the claim, WITH a real number)');
  else if (!/\d/.test(atom.claim)) problems.push(`atom.claim has no number in it: "${atom.claim}"`);
  if (!atom.failure_mode) problems.push('atom.failure_mode is missing (how this goes wrong)');
  if (!atom.verification) problems.push('atom.verification is missing (the 10-second check a reader can run)');
  return problems;
}

// Returns null when `platforms:` is absent, which callers must treat as "no
// filter" rather than "no channels".
export function readPlatforms(packRaw) {
  const front = frontmatterLines(packRaw);
  const line = front?.find((l) => /^platforms:/.test(l.trim()));
  if (!line) return null;
  const m = line.match(/\[([^\]]*)\]/);
  if (!m) return null;
  return m[1]
    .split(',')
    .map((s) => s.trim().replace(/^["']|["']$/g, '').toLowerCase())
    .filter(Boolean);
}

// Which CHANNELS keys a `platforms:` list selects. Unknown names are ignored
// rather than fatal - the list is hand-edited and a typo should not silently
// post nothing.
export function channelsForPlatforms(platforms) {
  if (!platforms) return null; // no filter
  const keys = new Set();
  for (const p of platforms) {
    const key = PLATFORM_TO_CHANNEL[p];
    if (key) keys.add(key);
  }
  return keys;
}

const POSTED_RE = /^\[( |x)\]\s*posted/im;

export function isPosted(raw) {
  const m = String(raw ?? '').match(POSTED_RE);
  return m ? m[1] === 'x' : false;
}

// Flip `[ ] posted` to `[x] posted` in place. Returns the new text, or null when
// there is no marker to flip (so callers can warn instead of silently doing
// nothing). extractBody() strips these lines, so the marker never reaches the
// clipboard.
export function markPosted(raw) {
  const text = String(raw ?? '');
  if (!POSTED_RE.test(text)) return null;
  return text.replace(POSTED_RE, (m) => m.replace('[ ]', '[x]'));
}

// Every posted link must carry a lowercase ?ref= token: site/lib/track.ts matches
// it case-sensitively, so `?ref=Bsky` is silently dropped and the attribution
// this whole scheme exists to collect is lost with no error anywhere.
export function refProblems(label, body) {
  const problems = [];
  const urls = body.match(/https?:\/\/(?:www\.)?adityadev\.in\/[^\s)>\]]*/g) ?? [];
  for (const url of urls) {
    const m = url.match(/[?&]ref=([^&\s]*)/);
    if (!m) problems.push(`${label}: link has no ?ref= (attribution lost): ${url}`);
    else if (m[1] !== m[1].toLowerCase()) problems.push(`${label}: ?ref=${m[1]} must be lowercase (track.ts is case-sensitive)`);
    else if (!m[1]) problems.push(`${label}: empty ?ref= on ${url}`);
  }
  return problems;
}

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
  // Two marker shapes are in use across the shipped packs, and only supporting
  // the first meant an inline-numbered thread parsed as ONE segment - so the
  // per-tweet length check silently never ran on it:
  //   "1/"            marker alone on its line, content follows
  //   "1/ Some text"   marker inline, content on the same line
  const marker = /^(\d+)\/(\s+(.*))?$/;
  if (!lines.some((l) => marker.test(l.trim()))) return [body.trim()];

  const segments = [];
  const seen = [];
  let current = null;
  for (const line of lines) {
    const m = line.trim().match(marker);
    if (m) {
      seen.push(Number(m[1]));
      if (current !== null) segments.push(current.trim());
      // Inline content after the marker is the segment's first line.
      current = m[3] ? m[3] + '\n' : '';
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
  problems.push(...refProblems(cfg.label, body));
  return { problems, segments };
}

export function readPack(slug, root = process.cwd(), { force = false } = {}) {
  const dir = join(root, 'ops', 'social', 'posts', slug);
  if (!existsSync(dir)) throw new Error(`no pack directory: ${dir}`);

  // `platforms:` in pack.md is the post-this-time set. Absent -> no filter (it is
  // present in only one of the three shipped packs, so defaulting to "none" would
  // make the tool post nothing for the other two).
  const packPath = join(dir, 'pack.md');
  const packRaw = existsSync(packPath) ? readFileSync(packPath, 'utf8') : '';
  const platforms = readPlatforms(packRaw);
  const wanted = channelsForPlatforms(platforms);

  // A topic-entry pack ships without a canonical article, so the atom itself is
  // the whole product. Throw BEFORE any channel work rather than letting an
  // unverifiable atom reach a composer.
  const entry = readEntry(packRaw);
  const atomIssues = atomProblems(entry, readAtom(packRaw));
  if (atomIssues.length) {
    throw new Error(
      `${slug}: topic-entry pack is missing required atom fields:\n  - ${atomIssues.join('\n  - ')}\n` +
        'Every atom needs a claim with a real number, the failure mode, and a 10-second verification.',
    );
  }

  const found = [];
  const skipped = [];
  for (const [key, cfg] of Object.entries(CHANNELS)) {
    const path = join(dir, cfg.file);
    if (!existsSync(path)) continue;
    if (wanted && !wanted.has(key)) { skipped.push(`${cfg.label} (not in platforms:)`); continue; }
    const raw = readFileSync(path, 'utf8');
    // Resume: the runbook tells you to space channels out over hours, so a
    // re-run must not re-offer what you already posted.
    if (!force && isPosted(raw)) { skipped.push(`${cfg.label} (already [x] posted)`); continue; }
    found.push({ key, cfg, raw, dir, path });
  }
  if (found.length === 0) {
    const why = skipped.length ? ` Skipped: ${skipped.join(', ')}. Use --force to include them.` : '';
    throw new Error(`no postable .md files to do in ${dir}.${why}`);
  }
  return { channels: found, skipped, platforms, entry, facts: factConflicts(found) };
}

// Cross-channel fact check. validateChannel sees ONE file at a time, so two
// channels citing two different numbers for the same fact both pass it - which is
// exactly what shipped: "1 in 8" in linkedin.md and x.md against "10-15%" in
// reddit.md, same claim, same pack, different numbers. Reddit was the last paste
// and the audience most likely to check.
//
// Deliberately narrow: it compares the NUMBERS each channel cites and reports when
// a pack's channels disagree about how many there are. It cannot know which is
// right - that is the human's call - but it can refuse to let the disagreement be
// invisible.
export function factConflicts(channels) {
  const numbersIn = (text) => {
    const found = new Set();
    // percentages, ratios, and bare figures with a unit-ish neighbour
    for (const m of text.matchAll(/\b\d+(?:\.\d+)?\s*%|\b\d+\s*in\s*\d+\b|\b\d+(?:\.\d+)?\s*-\s*\d+(?:\.\d+)?\s*%/gi)) {
      found.add(m[0].replace(/\s+/g, '').toLowerCase());
    }
    return found;
  };

  const perChannel = channels.map(({ cfg, raw }) => ({ label: cfg.label, nums: numbersIn(extractBody(raw)) }));
  const conflicts = [];
  for (let i = 0; i < perChannel.length; i++) {
    for (let j = i + 1; j < perChannel.length; j++) {
      const a = perChannel[i];
      const b = perChannel[j];
      if (!a.nums.size || !b.nums.size) continue;
      const shared = [...a.nums].filter((n) => b.nums.has(n));
      if (shared.length) continue; // they agree on at least one figure
      conflicts.push(
        `${a.label} cites ${[...a.nums].join(', ')} but ${b.label} cites ${[...b.nums].join(', ')} - same pack, no figure in common. One of them is wrong.`,
      );
    }
  }
  return conflicts;
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
  if (pack.platforms) console.log(`  platforms: ${pack.platforms.join(', ')}\n`);
  for (const { key, cfg, raw } of pack.channels) {
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
  for (const s of pack.skipped) console.log(`  [--]   ${s}`);
  for (const c of pack.facts ?? []) {
    anyProblem = true;
    console.log(`  [FACT] ${c}`);
  }
  // Print the EXACT command, `--` included. npm swallows any argument starting
  // with `--` unless it is separated, so `npm run post <slug> --commit` silently
  // runs a dry run - and because the bare slug still gets through, it looks like
  // it worked. Telling the user the right string here beats documenting it.
  const slug = pack.channels[0]?.dir?.split('/').pop() ?? '<slug>';
  const cmd = `npm run post -- ${slug} --commit`;
  console.log(anyProblem
    ? `\nProblems found. Fix the packs above, then:\n  ${cmd}`
    : `\nAll channels valid. To copy + open composers:\n  ${cmd}\n\n(the "--" is required - without it npm eats the flag and you get this dry run again)`);
  return !anyProblem;
}

async function runCommit(pack) {
  console.log('COMMIT (v0) - copy text + open composer per channel. You paste + post.\n');
  const done = [];
  for (const { key, cfg, raw, path } of pack.channels) {
    const { problems, segments } = validateChannel(key, raw);
    if (problems.length) {
      console.log(`  [skip] ${cfg.label} skipped (validation): ${problems[0]}`);
      continue;
    }

    // One prompt PER SEGMENT. This used to join an 8-tweet thread into a single
    // clipboard blob with `---` separators, which meant re-splitting all eight by
    // hand in the composer - the single largest piece of manual work in the run.
    let abandoned = false;
    for (const [i, seg] of segments.entries()) {
      const where = segments.length > 1 ? ` ${i + 1}/${segments.length}` : '';
      copyToClipboard(seg);
      if (i === 0) openUrl(cfg.composer); // one tab per channel, not per segment
      const a = (await ask(`  ${cfg.label}${where}: copied (${seg.length} chars). [Enter]=pasted, s=skip channel: `)).trim().toLowerCase();
      if (a === 's') { abandoned = true; break; }
    }

    if (abandoned) {
      done.push({ channel: cfg.label, posted: false });
      continue;
    }

    // Write the tick back so a session resumed hours later does not re-offer this.
    const marked = markPosted(raw);
    if (marked) writeFileSync(path, marked);
    else console.log(`      (no "[ ] posted" line in ${cfg.file} - nothing to tick)`);
    done.push({ channel: cfg.label, posted: true });
  }
  console.log('\nSummary:');
  for (const d of done) console.log(`  ${d.posted ? '[posted] ' : '[skipped]'}  ${d.channel}`);
  console.log('\nTicked channels are recorded in the pack files. Re-run any time to continue;');
  console.log('add --force to re-offer everything.');
}

async function main() {
  const args = process.argv.slice(2);
  const slug = args.find((a) => !a.startsWith('-'));
  const commit = args.includes('--commit');
  const force = args.includes('--force');
  if (!slug) {
    console.error('usage: node apps/social-poster/post.mjs <slug> [--commit] [--force]');
    process.exit(1);
  }
  let pack;
  try {
    pack = readPack(slug, process.cwd(), { force });
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
