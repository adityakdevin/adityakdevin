// Per-layout data schema + validator. The single gate every infographic passes
// through before it renders - and the same gate the (later) AI-draft step will
// reuse as its retry check. Shape only; truth is the human's job before posting.
//
// Bounds come from /plan-design-review's per-layout visual spec: they are design
// constraints (what stays legible at 1080x1350), enforced as hard rejects. Over-
// bound data is rejected with a message so a human trims it - never shrunk to fit.

export const LAYOUTS = ['table', 'grid', 'cheatsheet', 'diagram'];

// Legibility ceilings per layout. Calibrated against real renders: at maxRows=8
// / maxCells=18 the footer (adityadev.in + dots) gets pushed off the 1350px
// canvas, so the true ceilings are 7 rows and 15 cells (5x3). ponytail: these are
// tuning knobs; bump them only if the footer still fits at the new count.
export const BOUNDS = {
  table:      { cols: 3, maxRows: 7, maxCell: 26 },
  grid:       { maxCells: 15, maxCode: 6, maxLabel: 22, maxDesc: 40 },
  cheatsheet: { maxSections: 6, maxLines: 5, maxLine: 40 },
  diagram:    { maxSatellites: 8, maxLabel: 22 },
};

const nonEmpty = (s) => typeof s === 'string' && s.trim().length > 0;

// Returns { problems: string[] }. Empty problems === valid.
export function validate(layout, data) {
  const problems = [];
  if (!LAYOUTS.includes(layout)) {
    return { problems: [`unknown layout "${layout}" (expected one of: ${LAYOUTS.join(', ')})`] };
  }
  if (data == null || typeof data !== 'object') {
    return { problems: ['data must be an object'] };
  }
  if (!nonEmpty(data.title)) problems.push('title is required and must be non-empty');
  if (data.chip != null && !nonEmpty(data.chip)) problems.push('chip, if present, must be non-empty');

  const b = BOUNDS[layout];
  const tooLong = (s, max, where) => {
    if (typeof s === 'string' && s.length > max) problems.push(`${where}: "${s}" is ${s.length} chars > ${max} limit (trim it)`);
  };

  if (layout === 'table') {
    if (!Array.isArray(data.columns) || data.columns.length !== b.cols) {
      problems.push(`table needs exactly ${b.cols} columns (got ${Array.isArray(data.columns) ? data.columns.length : 'none'})`);
    } else {
      data.columns.forEach((c, i) => { if (!nonEmpty(c)) problems.push(`column ${i + 1} is empty`); });
    }
    if (!Array.isArray(data.rows) || data.rows.length === 0) {
      problems.push('table needs at least 1 row');
    } else {
      if (data.rows.length > b.maxRows) problems.push(`${data.rows.length} rows > ${b.maxRows} max (split into two posts)`);
      data.rows.forEach((row, r) => {
        if (!Array.isArray(row) || row.length !== b.cols) {
          problems.push(`row ${r + 1} must have exactly ${b.cols} cells (got ${Array.isArray(row) ? row.length : 'none'})`);
          return;
        }
        row.forEach((cell, c) => {
          if (!nonEmpty(cell)) problems.push(`row ${r + 1} cell ${c + 1} is empty`);
          tooLong(cell, b.maxCell, `row ${r + 1} cell ${c + 1}`);
        });
      });
    }
  } else if (layout === 'grid') {
    if (!Array.isArray(data.cells) || data.cells.length === 0) {
      problems.push('grid needs at least 1 cell');
    } else {
      if (data.cells.length > b.maxCells) problems.push(`${data.cells.length} cells > ${b.maxCells} max`);
      data.cells.forEach((cell, i) => {
        if (!nonEmpty(cell?.code)) problems.push(`cell ${i + 1} missing code`);
        if (!nonEmpty(cell?.label)) problems.push(`cell ${i + 1} missing label`);
        tooLong(cell?.code, b.maxCode, `cell ${i + 1} code`);
        tooLong(cell?.label, b.maxLabel, `cell ${i + 1} label`);
        tooLong(cell?.desc, b.maxDesc, `cell ${i + 1} desc`);
      });
    }
  } else if (layout === 'cheatsheet') {
    if (!Array.isArray(data.sections) || data.sections.length === 0) {
      problems.push('cheatsheet needs at least 1 section');
    } else {
      if (data.sections.length > b.maxSections) problems.push(`${data.sections.length} sections > ${b.maxSections} max`);
      data.sections.forEach((s, i) => {
        if (!nonEmpty(s?.title)) problems.push(`section ${i + 1} missing title`);
        if (!Array.isArray(s?.lines) || s.lines.length === 0) problems.push(`section ${i + 1} needs at least 1 line`);
        else if (s.lines.length > b.maxLines) problems.push(`section ${i + 1} has ${s.lines.length} lines > ${b.maxLines} max`);
      });
    }
  } else if (layout === 'diagram') {
    if (!nonEmpty(data.center)) problems.push('diagram needs a center label');
    if (!Array.isArray(data.satellites) || data.satellites.length === 0) {
      problems.push('diagram needs at least 1 satellite');
    } else if (data.satellites.length > b.maxSatellites) {
      problems.push(`${data.satellites.length} satellites > ${b.maxSatellites} max`);
    }
  }

  return { problems };
}
