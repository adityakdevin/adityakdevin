// Pure HTML templating: (layout, data) -> a full self-contained HTML string.
// No IO, no browser - just a string, so it is cheap to unit-test hard. The render
// step screenshots whatever this returns. Content is HTML-escaped: infographic
// data is AI/user-authored, so a stray "<" must never break the markup.

import { BRAND, CANVAS, statusColor } from './tokens.mjs';

// Escape the five HTML-significant chars. Applied to every piece of card content.
export function esc(s) {
  return String(s ?? '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function shell({ fontRegular, fontSemibold, chip, title, accent, body }) {
  // Single standalone image: no slide counter, no carousel dots (those belong to
  // the multi-slide social-card carousel, not a one-shot reference card).
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:'Plex';src:url('file://${fontRegular}') format('truetype');font-weight:400}
@font-face{font-family:'Plex';src:url('file://${fontSemibold}') format('truetype');font-weight:600}
*{margin:0;padding:0;box-sizing:border-box}
html,body{background:${BRAND.bgFade}}
.card{width:${CANVAS.w}px;height:${CANVAS.h}px;background:linear-gradient(148deg,#0d3b46 0%,${BRAND.bg} 44%,${BRAND.bgFade} 100%);font-family:'Plex',ui-monospace,Menlo,monospace;color:${BRAND.text};padding:72px;display:flex;flex-direction:column}
.tophdr{display:flex;justify-content:space-between;align-items:center}
.chip{background:${accent};color:#06121a;font-weight:600;font-size:26px;letter-spacing:2px;padding:12px 26px;border-radius:999px}
.title{font-size:72px;font-weight:600;line-height:1.1;margin-top:40px}
.rule{width:120px;height:10px;background:${accent};border-radius:999px;margin:28px 0 40px}
.body{flex-grow:1}
table{width:100%;border-collapse:collapse;font-size:30px}
thead td{color:${accent};font-weight:600;padding:22px 20px;border-bottom:2px solid ${accent}55}
tbody td{padding:24px 20px;border-bottom:1px solid ${BRAND.border};vertical-align:top}
tbody tr:nth-child(odd){background:${BRAND.panel}}
.feat{color:${BRAND.muted};font-weight:600;width:30%}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.gcell{background:${BRAND.panel};border:1px solid ${BRAND.border};border-left:6px solid var(--gc);border-radius:12px;padding:22px 24px;display:flex;flex-direction:column;gap:8px}
.gcode{font-size:40px;font-weight:600;color:var(--gc);line-height:1}
.glabel{font-size:24px;font-weight:600;color:${BRAND.text}}
.gdesc{font-size:22px;color:${BRAND.muted};line-height:1.3}
.sheet{display:grid;grid-template-columns:repeat(2,1fr);gap:20px}
.scell{background:${BRAND.panel};border:1px solid ${BRAND.border};border-top:5px solid var(--sc);border-radius:12px;padding:24px 26px;display:flex;flex-direction:column;gap:12px}
.stitle{font-size:30px;font-weight:600;color:var(--sc)}
.sline{font-size:24px;color:${BRAND.text};line-height:1.35}
.diagram{position:relative;width:936px;height:860px}
.dsvg{position:absolute;inset:0}
.dnode{position:absolute;transform:translate(-50%,-50%);background:${BRAND.panel};border:1px solid ${BRAND.border};border-radius:10px;padding:14px 22px;font-size:24px;font-weight:600;color:${BRAND.text};white-space:nowrap;text-align:center}
.dnode.center{border:2px solid ${BRAND.accent.cyan};color:${BRAND.accent.cyan};font-size:30px;padding:22px 30px}
.footer{margin-top:auto;display:flex;justify-content:space-between;align-items:center}
.dom{display:flex;align-items:center;font-size:26px;font-weight:600}
.tick{width:40px;height:6px;background:${accent};border-radius:999px;margin-right:16px}
</style></head><body><div class="card">
<div class="tophdr"><div class="chip">${esc(chip)}</div></div>
<div class="title">${esc(title)}</div>
<div class="rule"></div>
<div class="body">${body}</div>
<div class="footer"><div class="dom"><span class="tick"></span>adityadev.in</div></div>
</div></body></html>`;
}

function tableBody(data) {
  const head = `<thead><tr>${data.columns.map((c, i) =>
    `<td${i === 0 ? ' class="feat"' : ''}>${esc(c)}</td>`).join('')}</tr></thead>`;
  const rows = data.rows.map((row) =>
    `<tr>${row.map((cell, i) => `<td${i === 0 ? ' class="feat"' : ''}>${esc(cell)}</td>`).join('')}</tr>`).join('');
  return `<table>${head}<tbody>${rows}</tbody></table>`;
}

function gridBody(data) {
  // Each cell colors itself from its code (2xx green, 4xx amber, ...) so the card
  // is scannable by color alone. Non-numeric codes fall back to cyan.
  const cells = data.cells.map((cell) => {
    const color = cell.color || statusColor(cell.code);
    const desc = cell.desc ? `<div class="gdesc">${esc(cell.desc)}</div>` : '';
    return `<div class="gcell" style="--gc:${esc(color)}">`
      + `<div class="gcode">${esc(cell.code)}</div>`
      + `<div class="glabel">${esc(cell.label)}</div>${desc}</div>`;
  }).join('');
  return `<div class="grid">${cells}</div>`;
}

// Section accents rotate so adjacent panels are visually distinct.
const SHEET_ACCENTS = [BRAND.accent.cyan, BRAND.accent.amber, BRAND.accent.green, BRAND.accent.purple];

function cheatsheetBody(data) {
  const sections = data.sections.map((s, i) => {
    const color = SHEET_ACCENTS[i % SHEET_ACCENTS.length];
    const lines = s.lines.map((l) => `<div class="sline">${esc(l)}</div>`).join('');
    return `<div class="scell" style="--sc:${color}"><div class="stitle">${esc(s.title)}</div>${lines}</div>`;
  }).join('');
  return `<div class="sheet">${sections}</div>`;
}

function diagramBody(data) {
  // Center node with satellites on a ring; SVG lines connect center -> each.
  // Satellites are labels (strings) or {label}. Logo assets are a later add.
  const W = 936, H = 860, cx = W / 2, cy = H / 2, rx = 330, ry = 320;
  const sats = data.satellites.map((s) => (typeof s === 'string' ? s : s.label));
  const n = sats.length;
  const pts = sats.map((label, i) => {
    const a = (-90 + (i * 360) / n) * Math.PI / 180;
    return { x: Math.round(cx + rx * Math.cos(a)), y: Math.round(cy + ry * Math.sin(a)), label };
  });
  const lines = pts.map((p) =>
    `<line x1="${cx}" y1="${cy}" x2="${p.x}" y2="${p.y}" stroke="${BRAND.muted}" stroke-width="3"/>`).join('');
  const svg = `<svg class="dsvg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${lines}</svg>`;
  const nodes = pts.map((p) =>
    `<div class="dnode" style="left:${p.x}px;top:${p.y}px">${esc(p.label)}</div>`).join('');
  const center = `<div class="dnode center" style="left:${cx}px;top:${cy}px">${esc(data.center)}</div>`;
  return `<div class="diagram">${svg}${nodes}${center}</div>`;
}

// (layout, data, {fontRegular, fontSemibold}) -> HTML string.
export function fillTemplate(layout, data, { fontRegular, fontSemibold }) {
  const common = { fontRegular, fontSemibold, title: data.title, accent: BRAND.accent.cyan };
  if (layout === 'table') {
    return shell({ ...common, chip: data.chip || 'COMPARE', body: tableBody(data) });
  }
  if (layout === 'grid') {
    return shell({ ...common, chip: data.chip || 'REFERENCE', body: gridBody(data) });
  }
  if (layout === 'cheatsheet') {
    return shell({ ...common, chip: data.chip || 'CHEATSHEET', body: cheatsheetBody(data) });
  }
  if (layout === 'diagram') {
    return shell({ ...common, chip: data.chip || 'MAP', body: diagramBody(data) });
  }
  throw new Error(`layout "${layout}" is not a known layout`);
}

// exported for the status-color grid template (next increment)
export { statusColor };
