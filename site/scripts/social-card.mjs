// Carousel PNG build script (SOCIAL_MEDIA_PLAN.md — deferred renderer, now built).
//
// NOT a public route. A local, run-on-demand script — this is the safe shape the
// eng review asked for (a public /api/social-card would be an unauthenticated
// CPU-amplification endpoint; the repo already avoids that in
// app/blog/[slug]/opengraph-image.tsx). Reuses the site's IBM Plex Mono fonts +
// OG color tokens so cards match adityadev.in's aesthetic.
//
// Usage (from site/):  node scripts/social-card.mjs <slug>
// Reads:   ../ops/social/<slug>.media.md   (the `slides:` frontmatter block)
// Writes:  ../ops/social/<slug>/slide-N-<role>.png   (1080x1350, IG 4:5 portrait)

import { ImageResponse } from "next/og";
import { createElement as h } from "react";
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const ROOT = path.resolve(import.meta.dirname, "..", "..");         // repo root
const SOCIAL_DIR = path.join(ROOT, "ops", "social");
const FONT_DIR = path.join(import.meta.dirname, "..", "assets", "fonts");

// OG tokens (kept in sync with site/lib/og.tsx)
const BG = "#0d1117", ACCENT = "#22b8d4", MUTED = "#8b949e", TEXT = "#e6edf3", PANEL = "#161b22", BORDER = "#30363d";
const W = 1080, H = 1350;

// Satori can't render glyphs outside the embedded font. Plex Mono lacks a few
// symbols the copy uses — swap them for safe equivalents rather than ship tofu.
const safe = (s) =>
  String(s ?? "")
    .replaceAll("¢", " cents")
    .replaceAll("←", "<-")
    .replaceAll("→", "->")
    .replaceAll("’", "'")
    .replaceAll("“", '"').replaceAll("”", '"')
    .replaceAll("—", "--");

// Per-role type scale + label.
const ROLE = {
  hook:    { label: "HOOK",    size: 68, weight: 600 },
  problem: { label: "PROBLEM", size: 46, weight: 400 },
  result:  { label: "RESULT",  size: 46, weight: 600 },
  cta:     { label: "CTA",     size: 48, weight: 600 },
  code:    { label: "CODE",    size: 30, weight: 400, mono: true },
};

function slideElement({ role, text }, index, total, slug) {
  const cfg = ROLE[role] ?? { label: (role || "").toUpperCase(), size: 46, weight: 400 };
  const body = safe(text);

  const eyebrow = h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 22, color: MUTED } },
    h("span", {}, [h("span", { key: "d", style: { color: ACCENT } }, "$ "), `adityadev.in  ·  ${cfg.label}`]),
    h("span", {}, `${index + 1}/${total}`),
  );

  const content = cfg.mono
    ? h("div", { style: { display: "flex", background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 32, fontSize: cfg.size, lineHeight: 1.5, color: TEXT, whiteSpace: "pre-wrap" } }, body)
    : h("div", { style: { display: "flex", fontSize: cfg.size, fontWeight: cfg.weight, lineHeight: 1.25, color: TEXT } }, body);

  const footer = h("div", { style: { display: "flex", alignItems: "center", fontSize: 20, color: MUTED } },
    h("div", { style: { width: 48, height: 4, background: ACCENT, marginRight: 16 } }),
    `adityadev.in/blog/${slug}`,
  );

  return h("div", {
    style: {
      width: "100%", height: "100%", display: "flex", flexDirection: "column",
      justifyContent: "space-between", padding: 72, backgroundColor: BG, fontFamily: "Plex",
    },
  }, eyebrow, content, footer);
}

async function main() {
  const slug = process.argv[2];
  if (!slug) { console.error("usage: node scripts/social-card.mjs <slug>"); process.exit(1); }

  const packPath = path.join(SOCIAL_DIR, `${slug}.media.md`);
  const raw = await readFile(packPath, "utf-8").catch(() => null);
  if (raw == null) { console.error(`no media pack at ${packPath}`); process.exit(1); }

  const slides = matter(raw).data.slides;
  if (!Array.isArray(slides) || slides.length === 0) { console.error("no `slides:` array in the pack frontmatter"); process.exit(1); }

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

  let n = 0;
  for (const [i, slide] of slides.entries()) {
    const img = new ImageResponse(slideElement(slide, i, slides.length, slug), { width: W, height: H, fonts });
    const buf = Buffer.from(await img.arrayBuffer());
    const file = path.join(outDir, `slide-${i + 1}-${slide.role || "slide"}.png`);
    await writeFile(file, buf);
    console.log(`  ${path.relative(ROOT, file)}  (${buf.length} bytes)`);
    n++;
  }
  console.log(`Rendered ${n} slides for ${slug} → ${path.relative(ROOT, outDir)}/`);
  const listed = await readdir(outDir);
  console.log(`Dir now has: ${listed.join(", ")}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
