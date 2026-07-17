// Social card build script (SOCIAL_MEDIA_PLAN.md — the deferred renderer, built).
//
// NOT a public route. A local, run-on-demand script — the safe shape the eng
// review asked for (a public /api/social-card would be an unauthenticated
// CPU-amplification endpoint). Reuses the site's IBM Plex Mono fonts + OG color
// tokens so cards match adityadev.in.
//
// Usage (from site/):
//   bun run social-card <slug>          → carousel slides   (1080x1350, IG 4:5)   from `slides:`
//   bun run social-card <slug> --reel   → reel frames        (1080x1920, IG 9:16)  from `reel:`
//   bun run social-card <slug> --all    → both
// Reads:  ../ops/social/<slug>.media.md   Writes: ../ops/social/<slug>/*.png

import { ImageResponse } from "next/og";
import { createElement as h } from "react";
import { readFile, writeFile, mkdir, readdir, unlink } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const ROOT = path.resolve(import.meta.dirname, "..", "..");
const SOCIAL_DIR = path.join(ROOT, "ops", "social");
const FONT_DIR = path.join(import.meta.dirname, "..", "assets", "fonts");

const BG = "#0d1117", ACCENT = "#22b8d4", MUTED = "#8b949e", TEXT = "#e6edf3", PANEL = "#161b22", BORDER = "#30363d";

// Satori only renders glyphs the embedded font has. Plex Mono lacks a few the
// copy uses — swap them rather than ship tofu.
const safe = (s) =>
  String(s ?? "")
    .replaceAll("¢", " cents").replaceAll("≠", "!=")
    .replaceAll("←", "<-").replaceAll("→", "->")
    .replaceAll("’", "'").replaceAll("“", '"').replaceAll("”", '"').replaceAll("—", "--");

const ROLE = {
  hook:    { label: "HOOK",    size: 68, weight: 600 },
  problem: { label: "PROBLEM", size: 46, weight: 400 },
  result:  { label: "RESULT",  size: 46, weight: 600 },
  cta:      { label: "CTA",       size: 48, weight: 600 },
  code:     { label: "CODE",      size: 30, weight: 400, mono: true },
  guardrail:{ label: "GUARDRAIL", size: 44, weight: 600 },
};

function eyebrow(left, right) {
  return h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 22, color: MUTED } },
    h("span", {}, [h("span", { key: "d", style: { color: ACCENT } }, "$ "), left]),
    h("span", {}, right));
}
function footer(slug) {
  return h("div", { style: { display: "flex", alignItems: "center", fontSize: 20, color: MUTED } },
    h("div", { style: { width: 48, height: 4, background: ACCENT, marginRight: 16 } }),
    `adityadev.in/blog/${slug}`);
}

// Carousel slide — 1080x1350
function slideElement({ role, text }, i, total, slug) {
  const cfg = ROLE[role] ?? { label: (role || "").toUpperCase(), size: 46, weight: 400 };
  const content = cfg.mono
    ? h("div", { style: { display: "flex", background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 32, fontSize: cfg.size, lineHeight: 1.5, color: TEXT, whiteSpace: "pre-wrap" } }, safe(text))
    : h("div", { style: { display: "flex", fontSize: cfg.size, fontWeight: cfg.weight, lineHeight: 1.25, color: TEXT } }, safe(text));
  return h("div", { style: { width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, backgroundColor: BG, fontFamily: "Plex" } },
    eyebrow(`adityadev.in  ·  ${cfg.label}`, `${i + 1}/${total}`), content, footer(slug));
}

// Reel frame — 1080x1920, on-screen caption centered (a storyboard / burned-in text card)
function reelElement({ t, text, note }, i, total, slug) {
  const mid = h("div", { style: { display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", flexGrow: 1, textAlign: "center" } },
    h("div", { style: { display: "flex", fontSize: 76, fontWeight: 600, lineHeight: 1.2, color: TEXT, textAlign: "center" } }, safe(text)));
  const shot = note
    ? h("div", { style: { display: "flex", fontSize: 24, color: MUTED } }, `shot: ${safe(note)}`)
    : h("div", { style: { display: "flex" } });
  return h("div", { style: { width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 90, backgroundColor: BG, fontFamily: "Plex" } },
    eyebrow(`REEL  ·  ${t || ""}`, `${i + 1}/${total}`),
    mid,
    h("div", { style: { display: "flex", flexDirection: "column", gap: 24 } }, shot, footer(slug)));
}

async function render(items, kind, { W, Hgt, el, fonts, outDir, slug }) {
  // Clear stale files of this kind first — a shorter set (or renumbered slides)
  // must not leave orphans (e.g. an old slide-6 after dropping to 5).
  for (const f of await readdir(outDir).catch(() => [])) {
    if (f.startsWith(`${kind}-`) && f.endsWith(".png")) await unlink(path.join(outDir, f)).catch(() => {});
  }
  let n = 0;
  for (const [i, item] of items.entries()) {
    const img = new ImageResponse(el(item, i, items.length, slug), { width: W, height: Hgt, fonts });
    const buf = Buffer.from(await img.arrayBuffer());
    const file = path.join(outDir, `${kind}-${i + 1}-${(item.role || item.t || "frame").toString().replace(/[^a-z0-9]+/gi, "-")}.png`);
    await writeFile(file, buf);
    console.log(`  ${path.relative(ROOT, file)}  (${buf.length} bytes)`);
    n++;
  }
  return n;
}

async function main() {
  const slug = process.argv[2];
  const mode = process.argv[3] || "";
  if (!slug) { console.error("usage: bun run social-card <slug> [--reel|--all]"); process.exit(1); }
  const wantReel = mode === "--reel" || mode === "--all";
  const wantCarousel = mode === "" || mode === "--all";

  const raw = await readFile(path.join(SOCIAL_DIR, `${slug}.media.md`), "utf-8").catch(() => null);
  if (raw == null) { console.error(`no media pack at ops/social/${slug}.media.md`); process.exit(1); }
  const data = matter(raw).data;

  const [regular, semibold] = await Promise.all([
    readFile(path.join(FONT_DIR, "IBMPlexMono-Regular.ttf")),
    readFile(path.join(FONT_DIR, "IBMPlexMono-SemiBold.ttf")),
  ]);
  const fonts = [
    { name: "Plex", data: regular, weight: 400, style: "normal" },
    { name: "Plex", data: semibold, weight: 600, style: "normal" },
  ];
  const outDir = path.join(SOCIAL_DIR, slug);
  await mkdir(outDir, { recursive: true });

  let total = 0;
  if (wantCarousel) {
    if (Array.isArray(data.slides) && data.slides.length) {
      total += await render(data.slides, "slide", { W: 1080, Hgt: 1350, el: slideElement, fonts, outDir, slug });
    } else if (!wantReel) { console.error("no `slides:` array in the pack frontmatter"); process.exit(1); }
  }
  if (wantReel) {
    if (Array.isArray(data.reel) && data.reel.length) {
      total += await render(data.reel, "reel", { W: 1080, Hgt: 1920, el: reelElement, fonts, outDir, slug });
    } else { console.error("no `reel:` array in the pack frontmatter — add one (see /draft-social-media)"); process.exit(1); }
  }

  console.log(`Rendered ${total} image(s) → ${path.relative(ROOT, outDir)}/`);
  console.log(`Dir now has: ${(await readdir(outDir)).sort().join(", ")}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
