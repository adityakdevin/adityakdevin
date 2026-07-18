#!/usr/bin/env node
// infographic post handoff - stage a rendered infographic for a one-tap manual
// publish. Nothing auto-posts (the human gate, same as social-poster).
//
//   node apps/infographic/post.mjs <slug> [--composer <url>] [--dry]
//
// macOS: copies the caption to the clipboard (paste target), reveals the PNG in
// Finder (drag source), and opens the composer. Two gestures: drag the image,
// paste the caption. The clipboard holds one thing, so the image is the drag and
// the caption is the paste.
//
// ponytail: no deps. pbcopy/open are macOS; elsewhere it prints the paths.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

export const ROOT = resolve(import.meta.dirname, '..', '..');
const DEFAULT_COMPOSER = 'https://www.linkedin.com/feed/';

// Pick the rendered PNG for a slug (the newest <slug>-<layout>.png).
export function findPng(assetsDir, slug) {
  if (!existsSync(assetsDir)) return null;
  const pngs = readdirSync(assetsDir).filter((f) => f.startsWith(`${slug}-`) && f.endsWith('.png'));
  return pngs.length ? join(assetsDir, pngs.sort().at(-1)) : null;
}

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', ...opts });
  return r.status === 0;
}

export function post(slug, { composer = DEFAULT_COMPOSER, dry = false, root = ROOT } = {}) {
  const dir = join(root, 'ops', 'social', 'posts', slug);
  const png = findPng(join(dir, 'assets'), slug);
  if (!png) throw new Error(`no rendered PNG in ${dir}/assets/ - run: node apps/infographic/render.mjs ${slug}`);
  const captionPath = join(dir, 'caption.txt');
  const caption = existsSync(captionPath) ? readFileSync(captionPath, 'utf8').trim() : '';

  const plan = { png, caption: caption ? `${caption.length} chars` : '(none)', composer };
  if (dry) return { ...plan, staged: false };

  if (process.platform !== 'darwin') {
    console.warn('  (not macOS - clipboard/Finder/open skipped)');
    console.log(`  image:   ${png}`);
    console.log(`  caption: ${captionPath}`);
    console.log(`  composer: ${composer}`);
    return { ...plan, staged: false };
  }
  if (caption) run('pbcopy', [], { input: caption });   // paste target
  run('open', ['-R', png]);                              // reveal PNG to drag
  run('open', [composer]);                               // composer
  return { ...plan, staged: true };
}

function main() {
  const args = process.argv.slice(2);
  const slug = args.find((a) => !a.startsWith('-'));
  const dry = args.includes('--dry');
  const ci = args.indexOf('--composer');
  const composer = ci !== -1 ? args[ci + 1] : DEFAULT_COMPOSER;
  if (!slug) { console.error('usage: node apps/infographic/post.mjs <slug> [--composer <url>] [--dry]'); process.exit(1); }
  try {
    const r = post(slug, { composer, dry });
    if (dry) {
      console.log(`DRY: would stage\n  image:   ${r.png}\n  caption: ${r.caption}\n  composer: ${r.composer}`);
    } else if (r.staged) {
      console.log('Staged. Caption is on your clipboard, PNG revealed in Finder, composer open.');
      console.log('Drag the PNG into the post, then paste the caption. Nothing posted automatically.');
    }
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
