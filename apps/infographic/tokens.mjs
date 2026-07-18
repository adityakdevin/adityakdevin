// Shared brand tokens - the single source of truth for how an infographic looks.
// Mirrors the palette in site/scripts/social-card.mjs so infographics read as the
// same family as the narrative carousel cards. HTML-only render path, so tokens
// are emitted as CSS (no Satori style-object adapter needed).
//
// Locked by /plan-design-review 2026-07-18 (per-layout visual spec).

export const BRAND = {
  bg: '#0d1117',
  bgFade: '#05070a',
  text: '#e6edf3',
  muted: '#8b949e',
  panel: '#161b22',
  border: '#30363d',
  // Role accents. `compare` drives the table; grid maps HTTP-ish status -> color.
  accent: {
    cyan: '#22d3ee',
    amber: '#f5a623',
    green: '#3fb950',
    purple: '#a371f7',
    red: '#e5534b',
  },
};

// Canvas is fixed. The renderer pins the browser viewport to these exact numbers
// and clips to them, so every card is a true 1080x1350 (4:5) with no bleed.
export const CANVAS = { w: 1080, h: 1350 };

// IBM Plex Mono lives in the site workspace. Templates need an absolute file://
// path because the headless browser has no notion of the repo root.
export const FONT_FILES = {
  regular: 'site/assets/fonts/IBMPlexMono-Regular.ttf',
  semibold: 'site/assets/fonts/IBMPlexMono-SemiBold.ttf',
};

// Status-color map for the grid layout (HTTP-style cells). 2xx green, 3xx cyan,
// 4xx amber, 5xx red; anything else falls back to cyan.
export function statusColor(code) {
  const n = parseInt(String(code), 10);
  if (n >= 200 && n < 300) return BRAND.accent.green;
  if (n >= 300 && n < 400) return BRAND.accent.cyan;
  if (n >= 400 && n < 500) return BRAND.accent.amber;
  if (n >= 500 && n < 600) return BRAND.accent.red;
  return BRAND.accent.cyan;
}
