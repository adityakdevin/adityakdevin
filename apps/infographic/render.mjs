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

export function renderPack(slug, root = ROOT) {
  const dir = join(root, 'ops', 'social', 'posts', slug);
  const jsonPath = join(dir, 'infographic.json');
  if (!existsSync(jsonPath)) throw new Error(`no infographic.json at ${jsonPath}`);

  const data = JSON.parse(readFileSync(jsonPath, 'utf8'));
  const layout = data.layout;
  const { problems } = validate(layout, data);
  if (problems.length) {
    throw new Error(`invalid ${layout} data:\n  - ${problems.join('\n  - ')}`);
  }

  const html = fillTemplate(layout, data, {
    fontRegular: join(root, FONT_FILES.regular),
    fontSemibold: join(root, FONT_FILES.semibold),
  });

  const bin = resolveBrowse();
  if (!bin) throw new Error('browse binary not found (expected .claude/skills/gstack/browse/dist/browse)');

  // HTML goes to /tmp (a browse-allowed root); the PNG goes into the repo's
  // gitignored assets dir (also allowed).
  const tmpDir = '/private/tmp/infographic-render';
  mkdirSync(tmpDir, { recursive: true });
  const htmlPath = join(tmpDir, `${slug}.html`);
  writeFileSync(htmlPath, html);

  const assetsDir = join(dir, 'assets');
  mkdirSync(assetsDir, { recursive: true });
  const outPath = join(assetsDir, `${slug}-${layout}.png`);

  browse(bin, ['viewport', `${CANVAS.w}x${CANVAS.h}`]);
  browse(bin, ['goto', `file://${htmlPath}`]);
  browse(bin, ['screenshot', '--clip', `0,0,${CANVAS.w},${CANVAS.h}`, outPath]);

  // Fail loud on a wrong-size render (the eng-review critical gap).
  const { w, h } = pngSize(readFileSync(outPath));
  if (w !== CANVAS.w || h !== CANVAS.h) {
    throw new Error(`render is ${w}x${h}, expected ${CANVAS.w}x${CANVAS.h} - refusing to accept a bad-size PNG`);
  }
  return { outPath, layout, w, h };
}

function main() {
  const slug = process.argv.slice(2).find((a) => !a.startsWith('-'));
  if (!slug) {
    console.error('usage: node apps/infographic/render.mjs <slug>');
    process.exit(1);
  }
  try {
    const { outPath, layout, w, h } = renderPack(slug);
    console.log(`rendered ${layout} -> ${outPath.replace(ROOT + '/', '')} (${w}x${h})`);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
