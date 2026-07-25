#!/usr/bin/env node
// infographic AI draft (v1b) - topic -> schema-valid infographic.json.
//
//   node apps/infographic/draft.mjs "<topic>" --layout <table|grid|cheatsheet|diagram|fix> [--slug <slug>] [--model <id>]
//
// The model drafts the DATA only; the deterministic renderer draws it. The shared
// validate() is the retry gate: an invalid draft is sent back once with its errors
// before we give up. Correctness of the facts is still the human's job before
// posting (topic-first drafting was chosen with eyes open - see the design doc).
//
// ponytail: no SDK. One fetch to the Messages API. Needs ANTHROPIC_API_KEY.

import { writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { validate, BOUNDS, LAYOUTS } from './schema.mjs';

export const ROOT = resolve(import.meta.dirname, '..', '..');
const API_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-sonnet-5';

export function slugify(topic) {
  return String(topic).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'infographic';
}

// Pull the first JSON object out of a model reply (tolerates ```json fences and
// surrounding prose).
export function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) throw new Error('no JSON object in model reply');
  return JSON.parse(body.slice(start, end + 1));
}

// The per-layout prompt shape the model must fill. Bounds come from schema.mjs so
// the prompt and the validator agree on the numbers, but this is deliberately a
// SEPARATE map rather than one merged per-layout object: what the validator
// enforces and what the model is told to produce are different concerns, and a
// single object would pull templates.mjs render config in next.
//
// EVERY entry in LAYOUTS must appear here. shapeFor throws otherwise and
// infographic.test.mjs asserts the coverage, because `fix` shipped with bounds,
// a validator, 8 tests and a renderer but no prompt shape - so `--layout fix`
// sent the model a schema-less prompt and failed as a confusing retry loop.
const PROMPT_SHAPES = {
  table: (b) => `{"layout":"table","chip":"SHORT LABEL","title":"X vs Y","columns":["Aspect","X","Y"],"rows":[["label","x val","y val"], ...]} - exactly 3 columns; <=${b.maxRows} rows; every cell <=${b.maxCell} chars (terse).`,
  grid: (b) => `{"layout":"grid","chip":"SHORT LABEL","title":"...","cells":[{"code":"200","label":"OK","desc":"short"}, ...]} - <=${b.maxCells} cells; code <=${b.maxCode}, label <=${b.maxLabel}, desc <=${b.maxDesc} chars. For HTTP codes the code drives cell color.`,
  cheatsheet: (b) => `{"layout":"cheatsheet","chip":"SHORT LABEL","title":"...","sections":[{"title":"...","lines":["...", ...]}, ...]} - <=${b.maxSections} sections; <=${b.maxLines} lines each; keep lines terse.`,
  diagram: (b) => `{"layout":"diagram","chip":"SHORT LABEL","title":"...","center":"hub label","satellites":["A","B", ...]} - <=${b.maxSatellites} satellites; short labels.`,
  fix: (b) => `{"layout":"fix","chip":"SHORT LABEL","title":"N+1 queries","kicker":"optional","subtitle":"optional","wrong":{"label":"the mistake","code":"Post::all()","metric":"101 queries","metricNote":"optional","note":"optional"},"right":{"label":"the fix","code":"Post::with('author')->get()","metric":"2 queries","metricNote":"optional","note":"optional"},"footnote":"optional"} - code is a REAL multi-line snippet: <=${b.maxCodeLines} lines, every line <=${b.maxCodeLine} chars (it is NOT wrapped, so a long line overflows the frame). label <=${b.maxLabel}, metric <=${b.maxMetric}, metricNote <=${b.maxMetricNote}, note <=${b.maxNote}, kicker <=${b.maxKicker}, subtitle <=${b.maxSubtitle}, footnote <=${b.maxFootnote}. Give BOTH sides a metric or NEITHER - a one-sided number is an assertion, not a comparison. The measured before/after IS the payload.`,
};

export function shapeFor(layout) {
  const build = PROMPT_SHAPES[layout];
  if (!build) {
    throw new Error(
      `no prompt shape for layout "${layout}" - add one to PROMPT_SHAPES in draft.mjs. ` +
      `This used to return an empty string, which sent the model a prompt with no ` +
      `schema at all and surfaced as a validation retry loop instead of an error.`,
    );
  }
  return build(BOUNDS[layout]);
}

export function buildPrompt(topic, layout, errors) {
  const retry = errors ? `\n\nYour previous attempt failed validation:\n- ${errors.join('\n- ')}\nFix these and return corrected JSON.` : '';
  return `You are drafting DATA for a developer reference infographic. Topic: "${topic}". Layout: ${layout}.\n`
    + `Return ONLY a JSON object in this exact shape:\n${shapeFor(layout)}\n`
    + `Facts must be correct and concrete. Keep text terse enough to fit the char limits above. No prose, no markdown fences, JSON only.${retry}`;
}

async function callApi({ apiKey, model, prompt, fetchImpl = fetch }) {
  const res = await fetchImpl(API_URL, {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model, max_tokens: 1500, messages: [{ role: 'user', content: prompt }] }),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = await res.json();
  return json.content?.map((c) => c.text).join('') ?? '';
}

const hasBin = (bin) => spawnSync('which', [bin], { encoding: 'utf8' }).status === 0;

// Reuse the already-logged-in Claude Code / Codex CLI instead of an API key.
// Prompt goes in on stdin; extractJson digs the JSON out of whatever they print.
function callCli(bin, prompt) {
  const args = bin === 'claude' ? ['-p'] : ['exec'];
  const r = spawnSync(bin, args, { input: prompt, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`${bin} failed: ${(r.stderr || r.stdout || '').trim().slice(0, 200)}`);
  return r.stdout;
}

// Pick where drafting runs. Explicit --via wins; else prefer a logged-in CLI
// (no key needed), falling back to the API only if neither CLI is on PATH.
export function resolveProvider(explicit) {
  if (explicit) return explicit;
  if (hasBin('claude')) return 'claude';
  if (hasBin('codex')) return 'codex';
  return 'api';
}

async function complete(prompt, { provider, apiKey, model, fetchImpl = fetch }) {
  if (provider === 'claude' || provider === 'codex') return callCli(provider, prompt);
  if (!apiKey) throw new Error('no CLI found and ANTHROPIC_API_KEY not set (install/login `claude` or `codex`, or set the key)');
  return callApi({ apiKey, model, prompt, fetchImpl });
}

// Draft -> validate -> retry once -> return data. Throws if still invalid.
export async function draftInfographic(topic, layout, { provider = 'api', apiKey, model = DEFAULT_MODEL, fetchImpl = fetch } = {}) {
  if (!LAYOUTS.includes(layout)) throw new Error(`unknown layout "${layout}"`);
  let errors;
  for (let attempt = 0; attempt < 2; attempt++) {
    const text = await complete(buildPrompt(topic, layout, errors), { provider, apiKey, model, fetchImpl });
    let data;
    try { data = extractJson(text); } catch (e) { errors = [e.message]; continue; }
    data.layout = layout;
    const { problems } = validate(layout, data);
    if (problems.length === 0) return data;
    errors = problems;
  }
  throw new Error(`draft still invalid after retry:\n- ${errors.join('\n- ')}`);
}

async function main() {
  const args = process.argv.slice(2);
  const topic = args.find((a) => !a.startsWith('-'));
  const opt = (name, def) => { const i = args.indexOf(name); return i !== -1 ? args[i + 1] : def; };
  const layout = opt('--layout');
  if (!topic || !layout) {
    console.error('usage: node apps/infographic/draft.mjs "<topic>" --layout <table|grid|cheatsheet|diagram|fix> [--via claude|codex|api] [--slug <slug>] [--model <id>]');
    process.exit(1);
  }
  const slug = opt('--slug', slugify(topic));
  const provider = resolveProvider(opt('--via'));
  console.log(`drafting via ${provider}${provider === 'api' ? ' (API key)' : ' CLI (no key needed)'}...`);
  try {
    const data = await draftInfographic(topic, layout, { provider, apiKey: process.env.ANTHROPIC_API_KEY, model: opt('--model', DEFAULT_MODEL) });
    const dir = join(ROOT, 'ops', 'social', 'posts', slug);
    mkdirSync(dir, { recursive: true });
    const out = join(dir, 'infographic.json');
    writeFileSync(out, JSON.stringify(data, null, 2) + '\n');
    console.log(`drafted ${layout} -> ${out.replace(ROOT + '/', '')}`);
    console.log(`review the facts, then: node apps/infographic/render.mjs ${slug}`);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
