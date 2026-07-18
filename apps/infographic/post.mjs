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

// All rendered PNGs for a slug, in slide order (natural numeric sort so slide 10
// follows 9, not 1). A single card returns one; a carousel returns N.
export function findPngs(assetsDir, slug) {
  if (!existsSync(assetsDir)) return [];
  return readdirSync(assetsDir)
    .filter((f) => f.startsWith(`${slug}-`) && f.endsWith('.png'))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((f) => join(assetsDir, f));
}

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', ...opts });
  return r.status === 0;
}

export function post(slug, { composer = DEFAULT_COMPOSER, dry = false, root = ROOT } = {}) {
  const dir = join(root, 'ops', 'social', 'posts', slug);
  const assetsDir = join(dir, 'assets');
  const pngs = findPngs(assetsDir, slug);
  if (!pngs.length) throw new Error(`no rendered PNG in ${assetsDir}/ - run: node apps/infographic/render.mjs ${slug}`);
  const captionPath = join(dir, 'caption.txt');
  const caption = existsSync(captionPath) ? readFileSync(captionPath, 'utf8').trim() : '';

  const plan = { pngs, count: pngs.length, caption: caption ? `${caption.length} chars` : '(none)', composer };
  if (dry) return { ...plan, staged: false };

  if (process.platform !== 'darwin') {
    console.warn('  (not macOS - clipboard/Finder/open skipped)');
    pngs.forEach((p) => console.log(`  image:   ${p}`));
    console.log(`  caption: ${captionPath}`);
    console.log(`  composer: ${composer}`);
    return { ...plan, staged: false };
  }
  if (caption) run('pbcopy', [], { input: caption });         // paste target
  // Carousel: open the folder so all slides are selectable in order. Single: reveal it.
  run('open', pngs.length > 1 ? [assetsDir] : ['-R', pngs[0]]);
  run('open', [composer]);
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
    const what = r.count > 1 ? `${r.count}-slide carousel` : '1 image';
    if (dry) {
      console.log(`DRY: would stage ${what}\n${r.pngs.map((p) => `  image:   ${p}`).join('\n')}\n  caption: ${r.caption}\n  composer: ${r.composer}`);
    } else if (r.staged) {
      console.log(`Staged ${what}. Caption is on your clipboard, ${r.count > 1 ? 'the slides folder is' : 'the PNG is'} open in Finder, composer open.`);
      console.log('Add the image(s) to the post, then paste the caption. Nothing posted automatically.');
    }
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
