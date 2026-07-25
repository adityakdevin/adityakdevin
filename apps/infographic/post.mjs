#!/usr/bin/env node
// infographic post kit - print everything you need to publish an infographic by
// hand, on any platform. No drag-and-drop, no forced Finder: it prints the image
// path(s) to upload and the full caption (also copied to the clipboard as a
// convenience), plus composer links. Nothing posts automatically.
//
//   node apps/infographic/post.mjs <slug> [--slides|--infographic] [--open linkedin|facebook|instagram|all]
//
// The same 1080x1350 (4:5) PNG fits LinkedIn, Instagram, and Facebook feeds, so
// one render serves all three; you just upload it in each.
//
// Handles BOTH image pipelines, because they produce the same shape for the same
// three feeds and only differ in filename:
//   infographic  apps/infographic/render.mjs  -> <slug>-<layout>.png
//   blog carousel site/scripts/social-card.mjs -> slide-N-role.png
// Blog-pack slides previously had no staging path at all - they were dragged in by
// hand from Finder, which was the largest manual block in the posting runbook.
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

function pngsMatching(assetsDir, predicate) {
  if (!existsSync(assetsDir)) return [];
  return readdirSync(assetsDir)
    .filter((f) => f.endsWith('.png') && predicate(f))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((f) => join(assetsDir, f));
}

// Infographic output: render.mjs writes `<slug>-<layout>.png`.
export function findPngs(assetsDir, slug) {
  return pngsMatching(assetsDir, (f) => f.startsWith(`${slug}-`));
}

// Blog-pack carousel output: site/scripts/social-card.mjs writes `slide-N-role.png`.
// A different pipeline with a different naming scheme, which is why this is a
// second function rather than a looser filter on the one above - widening
// findPngs would make an infographic run scoop up foreign files.
export function findSlides(assetsDir) {
  return pngsMatching(assetsDir, (f) => /^slide-\d+/.test(f));
}

// Blog packs have no caption.txt (it exists in 1 of 9 pack dirs); their caption
// lives on a `Caption:` line in instagram-facebook.md. Read that so the kit is
// useful for a carousel without duplicating the text into a second file.
function captionFromMediaFile(dir) {
  const p = join(dir, 'instagram-facebook.md');
  if (!existsSync(p)) return '';
  const line = readFileSync(p, 'utf8').split('\n').find((l) => /^caption:/i.test(l.trim()));
  return line ? line.replace(/^caption:\s*/i, '').trim() : '';
}

// Build the post kit (pure: no IO beyond reads). Throws if nothing is rendered.
// kind: 'auto' | 'infographic' | 'slides'
export function postKit(slug, root = ROOT, { kind = 'auto' } = {}) {
  const dir = join(root, 'ops', 'social', 'posts', slug);
  const assets = join(dir, 'assets');
  const infographics = findPngs(assets, slug);
  const slides = findSlides(assets);

  let pngs;
  if (kind === 'infographic') pngs = infographics;
  else if (kind === 'slides') pngs = slides;
  else if (infographics.length && slides.length) {
    throw new Error(
      `${slug} has BOTH an infographic (${infographics.length}) and carousel slides (${slides.length}). ` +
        'Pick one: --infographic or --slides. Uploading a mixed set would post the wrong images.',
    );
  } else pngs = infographics.length ? infographics : slides;

  if (!pngs.length) {
    throw new Error(
      `no rendered PNG in ${assets}/ - run either:\n` +
        `  node apps/infographic/render.mjs ${slug}      (infographic)\n` +
        `  cd site && bun run social-card ${slug}        (blog carousel)`,
    );
  }

  const captionPath = join(dir, 'caption.txt');
  const caption = existsSync(captionPath)
    ? readFileSync(captionPath, 'utf8').trim()
    : captionFromMediaFile(dir);
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
  const kind = args.includes('--slides') ? 'slides' : args.includes('--infographic') ? 'infographic' : 'auto';
  if (!slug) {
    console.error('usage: node apps/infographic/post.mjs <slug> [--slides|--infographic] [--open linkedin|facebook|instagram|all]');
    process.exit(1);
  }
  let kit;
  try { kit = postKit(slug, ROOT, { kind }); } catch (err) { console.error(err.message); process.exit(1); }
  const copied = copyToClipboard(kit.caption);
  printKit(kit, { copied });
  if (openTo && process.platform === 'darwin') {
    const targets = openTo === 'all' ? Object.values(PLATFORMS) : [PLATFORMS[openTo]].filter(Boolean);
    targets.forEach((url) => spawnSync('open', [url]));
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
