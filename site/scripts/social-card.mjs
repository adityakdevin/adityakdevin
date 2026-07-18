// Social card build script (SOCIAL_MEDIA_PLAN.md — the deferred renderer, built).
//
// NOT a public route. A local, run-on-demand script — the safe shape the eng
// review asked for (a public /api/social-card would be an unauthenticated
// CPU-amplification endpoint). Reuses the site's IBM Plex Mono fonts + OG color
// tokens so cards match adityadev.in.
//
// These PNGs go to Instagram + Facebook (the /draft-social-media pack; the text
// pack renders no images). So the look is tuned for a scroll feed, not a dev
// terminal: per-role color, gradient wash, a filled role chip, editor chrome on
// code slides, progress dots. Brand stays IBM Plex Mono + adityadev.in.
//
// Usage (from site/):
//   bun run social-card <slug>          → carousel slides   (1080x1350, IG 4:5)   from `slides:`
//   bun run social-card <slug> --reel   → reel frames        (1080x1920, IG 9:16)  from `reel:`
//   bun run social-card <slug> --all    → both
// Reads:  ../ops/social/posts/<slug>/pack.md   Writes: ../ops/social/posts/<slug>/assets/*.png

import { ImageResponse } from "next/og";
import { createElement as h } from "react";
import { readFile, writeFile, mkdir, readdir, unlink } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const ROOT = path.resolve(import.meta.dirname, "..", "..");
const SOCIAL_DIR = path.join(ROOT, "ops", "social");
const FONT_DIR = path.join(import.meta.dirname, "..", "assets", "fonts");

const BG = "#0d1117", TEXT = "#e6edf3", MUTED = "#8b949e", PANEL = "#161b22", BORDER = "#30363d";

// Satori only renders glyphs the embedded font has. Plex Mono lacks a few the
// copy uses — swap them rather than ship tofu.
const safe = (s) =>
  String(s ?? "")
    .replaceAll("¢", " cents").replaceAll("≠", "!=")
    .replaceAll("←", "<-").replaceAll("→", "->")
    .replaceAll("’", "'").replaceAll("“", '"').replaceAll("”", '"').replaceAll("—", "--");

// Per-role color + copy config. accent = the punch color; tint = the wash the
// background gradient bleeds from (a dark, saturated version of the accent).
const ROLE = {
  hook:      { label: "HOOK",      size: 74, accent: "#22d3ee", tint: "#0d3b46" },
  problem:   { label: "THE PROBLEM", size: 52, accent: "#f5a623", tint: "#3d2c0a" },
  result:    { label: "WHAT WORKS", size: 52, accent: "#3fb950", tint: "#0e3a1e" },
  guardrail: { label: "GUARDRAIL", size: 50, accent: "#a371f7", tint: "#241046" },
  code:      { label: "THE CODE",  size: 32, accent: "#22d3ee", tint: "#0d2f3b", mono: true },
  cta:       { label: "READ MORE", size: 56, accent: "#22d3ee", tint: "#0d3b46" },
};
const themeFor = (role) => ROLE[role] ?? { label: (role || "").toUpperCase(), size: 50, accent: "#22d3ee", tint: "#0d3b46" };

function bgStyle(tint) {
  // Diagonal color wash out of near-black — depth + a hint of the role color
  // so the card is not a flat rectangle in the feed.
  return `linear-gradient(148deg, ${tint} 0%, ${BG} 44%, #05070a 100%)`;
}

// Filled role pill (top-left) — the loud, instantly-readable label.
function chip(label, accent) {
  return h("div", { style: { display: "flex", alignItems: "center", background: accent, color: "#06121a", fontSize: 26, fontWeight: 600, letterSpacing: 2, padding: "12px 26px", borderRadius: 999 } }, label);
}
// Counter (top-right).
function counter(txt, accent) {
  return h("div", { style: { display: "flex", fontSize: 30, fontWeight: 600, color: accent } }, txt);
}
// Short thick accent rule that anchors the headline (so text isn't floating).
function rule(accent, w = 120) {
  return h("div", { style: { display: "flex", width: w, height: 10, background: accent, borderRadius: 999 } });
}
// Progress dots — current in accent, rest muted.
function dots(i, total, accent) {
  return h("div", { style: { display: "flex", gap: 12 } },
    Array.from({ length: total }, (_, k) =>
      h("div", { key: k, style: { display: "flex", width: 14, height: 14, borderRadius: 999, background: k === i ? accent : "#2a3038" } })));
}
function footer(slug, accent, i, total) {
  // Domain only — the full blog slug isn't clickable in an image and, at this
  // length, collided with the progress dots. The CTA travels via "link in bio".
  return h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
    h("div", { style: { display: "flex", alignItems: "center", fontSize: 26, fontWeight: 600, color: TEXT } },
      h("div", { style: { display: "flex", width: 40, height: 6, background: accent, borderRadius: 999, marginRight: 16 } }),
      "adityadev.in"),
    dots(i, total, accent));
}

// Code panel with editor chrome (window dots + filename) — reads instantly as
// "real code" and adds color the plain mono card lacked.
function codePanel(text, accent) {
  const dot = (c) => h("div", { key: c, style: { display: "flex", width: 20, height: 20, borderRadius: 999, background: c } });
  const bar = h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0d1117", borderBottom: `1px solid ${BORDER}`, padding: "20px 28px" } },
    h("div", { style: { display: "flex", gap: 14 } }, dot("#ff5f56"), dot("#ffbd2e"), dot("#27c93f")),
    h("div", { style: { display: "flex", fontSize: 22, color: MUTED } }, "handler.php"));
  const body = h("div", { style: { display: "flex", padding: 34, fontSize: 32, lineHeight: 1.55, color: TEXT, whiteSpace: "pre-wrap" } }, safe(text));
  return h("div", { style: { display: "flex", flexDirection: "column", width: "100%", background: PANEL, border: `1px solid ${accent}55`, borderRadius: 16, overflow: "hidden" } }, bar, body);
}

// Carousel slide — 1080x1350
function slideElement(item, i, total, slug) {
  const cfg = themeFor(item.role);
  const body = cfg.mono
    ? codePanel(item.text, cfg.accent)
    : h("div", { style: { display: "flex", flexDirection: "column", gap: 34 } },
        rule(cfg.accent),
        h("div", { style: { display: "flex", fontSize: cfg.size, fontWeight: 600, lineHeight: 1.18, color: TEXT } }, safe(item.text)));
  return h("div", { style: { width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, backgroundImage: bgStyle(cfg.tint), fontFamily: "Plex" } },
    h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } }, chip(cfg.label, cfg.accent), counter(`${i + 1} / ${total}`, cfg.accent)),
    h("div", { style: { display: "flex", flexDirection: "column", justifyContent: "center", flexGrow: 1 } }, body),
    footer(slug, cfg.accent, i, total));
}

// Reel frame — 1080x1920, big burned-in caption (a storyboard card)
function reelElement(item, i, total, slug) {
  const accent = "#22d3ee", tint = "#0d3b46";
  const mid = h("div", { style: { display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", flexGrow: 1, gap: 40 } },
    rule(accent, 140),
    h("div", { style: { display: "flex", fontSize: 82, fontWeight: 600, lineHeight: 1.18, color: TEXT, textAlign: "center" } }, safe(item.text)));
  const shot = item.note
    ? h("div", { style: { display: "flex", fontSize: 26, color: MUTED } }, `shot: ${safe(item.note)}`)
    : h("div", { style: { display: "flex" } });
  return h("div", { style: { width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 90, backgroundImage: bgStyle(tint), fontFamily: "Plex" } },
    h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } }, chip(`REEL · ${item.t || ""}`, accent), counter(`${i + 1} / ${total}`, accent)),
    mid,
    h("div", { style: { display: "flex", flexDirection: "column", gap: 26 } }, shot, footer(slug, accent, i, total)));
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

  const packPath = path.join(SOCIAL_DIR, "posts", slug, "pack.md");
  const raw = await readFile(packPath, "utf-8").catch(() => null);
  if (raw == null) { console.error(`no pack at ops/social/posts/${slug}/pack.md`); process.exit(1); }
  const data = matter(raw).data;

  const [regular, semibold] = await Promise.all([
    readFile(path.join(FONT_DIR, "IBMPlexMono-Regular.ttf")),
    readFile(path.join(FONT_DIR, "IBMPlexMono-SemiBold.ttf")),
  ]);
  const fonts = [
    { name: "Plex", data: regular, weight: 400, style: "normal" },
    { name: "Plex", data: semibold, weight: 600, style: "normal" },
  ];
  const outDir = path.join(SOCIAL_DIR, "posts", slug, "assets");
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
