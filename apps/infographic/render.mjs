#!/usr/bin/env node
// infographic v1a - data -> branded PNG, via a headless-browser screenshot.
//
//   node apps/infographic/render.mjs <slug>
//     reads  ops/social/posts/<slug>/infographic.json
//     writes ops/social/posts/<slug>/assets/<slug>-<layout>.png
//
// Pipeline: validate(data) -> fillTemplate(html) -> browse viewport 1080x1350
// -> goto -> screenshot --clip -> assert the PNG really is 1080x1350 (fail loud;
// a wrong-size render must never be accepted, per the eng-review critical gap).
//
// ponytail: no deps. Uses the gstack `browse` binary already on disk.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { homedir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { validate } from './schema.mjs';
import { fillTemplate } from './templates.mjs';
import { CANVAS, FONT_FILES } from './tokens.mjs';

export const ROOT = resolve(import.meta.dirname, '..', '..');

// Locate the browse binary the same way the gstack skills do: repo copy first,
// then the per-user install.
export function resolveBrowse() {
  const repoBin = join(ROOT, '.claude', 'skills', 'gstack', 'browse', 'dist', 'browse');
  if (existsSync(repoBin)) return repoBin;
  const homeBin = join(homedir(), '.claude', 'skills', 'gstack', 'browse', 'dist', 'browse');
  if (existsSync(homeBin)) return homeBin;
  return null;
}

// Read a PNG's width/height straight from the IHDR chunk (bytes 16-23,
// big-endian). Dependency-free, and enough to prove the render is the right size.
export function pngSize(buf) {
  if (buf.length < 24 || buf.toString('ascii', 12, 16) !== 'IHDR') {
    throw new Error('not a PNG (no IHDR)');
  }
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

function browse(bin, args) {
  const r = spawnSync(bin, args, { encoding: 'utf8' });
  if (r.status !== 0) {
    throw new Error(`browse ${args[0]} failed: ${(r.stderr || r.stdout || '').trim()}`);
  }
  return r;
}

// Render one HTML string to a size-asserted PNG.
function renderOne(bin, html, htmlPath, outPath) {
  writeFileSync(htmlPath, html);
  browse(bin, ['viewport', `${CANVAS.w}x${CANVAS.h}`]);
  browse(bin, ['goto', `file://${htmlPath}`]);
  browse(bin, ['screenshot', '--clip', `0,0,${CANVAS.w},${CANVAS.h}`, outPath]);
  const { w, h } = pngSize(readFileSync(outPath));   // fail loud on a wrong-size render
  if (w !== CANVAS.w || h !== CANVAS.h) {
    throw new Error(`render is ${w}x${h}, expected ${CANVAS.w}x${CANVAS.h} - refusing to accept a bad-size PNG`);
  }
}

// A pack is either a single card ({layout,...}) or a carousel ({carousel:[card,...]}).
// A carousel renders one numbered PNG per slide (with the N/total pager); a single
// card renders one PNG with no pager.
export function renderPack(slug, root = ROOT) {
  const dir = join(root, 'ops', 'social', 'posts', slug);
  const jsonPath = join(dir, 'infographic.json');
  if (!existsSync(jsonPath)) throw new Error(`no infographic.json at ${jsonPath}`);
  const data = JSON.parse(readFileSync(jsonPath, 'utf8'));
  const slides = Array.isArray(data.carousel) ? data.carousel : [data];
  if (slides.length === 0) throw new Error('carousel is empty');

  // Validate every slide up front, so a bad slide 3 fails before slide 1 renders.
  slides.forEach((s, i) => {
    const { problems } = validate(s.layout, s);
    if (problems.length) throw new Error(`slide ${i + 1} invalid ${s.layout}:\n  - ${problems.join('\n  - ')}`);
  });

  const bin = resolveBrowse();
  if (!bin) throw new Error('browse binary not found (expected .claude/skills/gstack/browse/dist/browse)');
  const fonts = { fontRegular: join(root, FONT_FILES.regular), fontSemibold: join(root, FONT_FILES.semibold) };
  const tmpDir = '/private/tmp/infographic-render';
  mkdirSync(tmpDir, { recursive: true });
  const assetsDir = join(dir, 'assets');
  mkdirSync(assetsDir, { recursive: true });

  const total = slides.length;
  const rendered = slides.map((s, i) => {
    const page = total > 1 ? { index: i, total } : null;
    const html = fillTemplate(s.layout, s, { ...fonts, page });
    const name = total > 1 ? `${slug}-${i + 1}-${s.layout}` : `${slug}-${s.layout}`;
    const outPath = join(assetsDir, `${name}.png`);
    renderOne(bin, html, join(tmpDir, `${name}.html`), outPath);
    return { outPath, layout: s.layout };
  });
  return { slides: rendered, total };
}

function main() {
  const slug = process.argv.slice(2).find((a) => !a.startsWith('-'));
  if (!slug) {
    console.error('usage: node apps/infographic/render.mjs <slug>');
    process.exit(1);
  }
  try {
    const { slides, total } = renderPack(slug);
    if (total > 1) console.log(`rendered ${total}-slide carousel:`);
    for (const s of slides) console.log(`  ${s.layout} -> ${s.outPath.replace(ROOT + '/', '')}`);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
