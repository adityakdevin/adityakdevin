#!/usr/bin/env node
// infographic post kit - print everything you need to publish an infographic by
// hand, on any platform. No drag-and-drop, no forced Finder: it prints the image
// path(s) to upload and the full caption (also copied to the clipboard as a
// convenience), plus composer links. Nothing posts automatically.
//
//   node apps/infographic/post.mjs <slug> [--open linkedin|facebook|instagram|all]
//
// The same 1080x1350 (4:5) PNG fits LinkedIn, Instagram, and Facebook feeds, so
// one render serves all three; you just upload it in each.
//
// ponytail: no deps. pbcopy/open are macOS (skipped elsewhere).

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

export const ROOT = resolve(import.meta.dirname, '..', '..');

export const PLATFORMS = {
  linkedin: 'https://www.linkedin.com/feed/',
  facebook: 'https://www.facebook.com/',
  instagram: 'https://www.instagram.com/',
};

// All rendered PNGs for a slug, in slide order (natural numeric sort).
export function findPngs(assetsDir, slug) {
  if (!existsSync(assetsDir)) return [];
  return readdirSync(assetsDir)
    .filter((f) => f.startsWith(`${slug}-`) && f.endsWith('.png'))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((f) => join(assetsDir, f));
}

// Build the post kit (pure: no IO). Throws if nothing is rendered yet.
export function postKit(slug, root = ROOT) {
  const dir = join(root, 'ops', 'social', 'posts', slug);
  const pngs = findPngs(join(dir, 'assets'), slug);
  if (!pngs.length) throw new Error(`no rendered PNG in ${dir}/assets/ - run: node apps/infographic/render.mjs ${slug}`);
  const captionPath = join(dir, 'caption.txt');
  const caption = existsSync(captionPath) ? readFileSync(captionPath, 'utf8').trim() : '';
  return { pngs, caption, captionPath };
}

function copyToClipboard(text) {
  if (process.platform !== 'darwin' || !text) return false;
  return spawnSync('pbcopy', [], { input: text }).status === 0;
}

function printKit({ pngs, caption, captionPath }, { copied }) {
  const carousel = pngs.length > 1;
  console.log(`\n=== POST KIT: ${carousel ? `${pngs.length}-slide carousel` : '1 image'} ===\n`);
  console.log(carousel ? 'IMAGES (upload in this order):' : 'IMAGE (upload this):');
  pngs.forEach((p, i) => console.log(`  ${carousel ? `${i + 1}. ` : ''}${p}`));
  console.log('');
  if (caption) {
    console.log(`CAPTION${copied ? ' (also copied to clipboard)' : ''}:`);
    console.log(caption.split('\n').map((l) => `  ${l}`).join('\n'));
  } else {
    console.log(`CAPTION: (none) - write one at ${captionPath}`);
  }
  console.log('\nPOST TO (open the composer, upload the image, paste the caption):');
  console.log(`  LinkedIn:  ${PLATFORMS.linkedin}`);
  console.log(`  Facebook:  ${PLATFORMS.facebook}`);
  console.log(`  Instagram: ${PLATFORMS.instagram}  (web post or mobile; 4:5 fits the feed)`);
  console.log('\nNothing posted automatically.\n');
}

function main() {
  const args = process.argv.slice(2);
  const slug = args.find((a) => !a.startsWith('-'));
  const oi = args.indexOf('--open');
  const openTo = oi !== -1 ? (args[oi + 1] || 'all') : null;
  if (!slug) { console.error('usage: node apps/infographic/post.mjs <slug> [--open linkedin|facebook|instagram|all]'); process.exit(1); }
  let kit;
  try { kit = postKit(slug); } catch (err) { console.error(err.message); process.exit(1); }
  const copied = copyToClipboard(kit.caption);
  printKit(kit, { copied });
  if (openTo && process.platform === 'darwin') {
    const targets = openTo === 'all' ? Object.values(PLATFORMS) : [PLATFORMS[openTo]].filter(Boolean);
    targets.forEach((url) => spawnSync('open', [url]));
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
