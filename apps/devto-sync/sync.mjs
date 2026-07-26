#!/usr/bin/env node
// devto-sync - update an existing Dev.to article's body WITHOUT ever changing
// its published state.
//
// Why this exists: Dev.to's PUT /articles/<id> defaults `published` to TRUE when
// the payload contains body_markdown. The old /draft-devto-post Mode C "fixed"
// that by hardcoding published:false - correct for a draft, DESTRUCTIVE for a
// published article, which it silently delists. All four adityadev.in articles
// are published, so that path was one command away from delisting live, indexed
// content.
//
// The invariant here is stronger and needs no human gate: a PUT never CHANGES
// `published`. We look the article up, echo its current value back, and verify
// afterwards that it did not move. Publishing and unpublishing stay manual, in
// the Dev.to dashboard, where they belong.
//
// Usage:
//   node apps/devto-sync/sync.mjs <slug>            # dry-run (default)
//   node apps/devto-sync/sync.mjs <slug> --commit   # actually PUT
//
// ponytail: no deps. fetch is injectable so the guard is testable without
// touching the network - that is the whole reason this is a module and not
// prose in a SKILL.md.

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const API = 'https://dev.to/api';
const SITE = 'https://adityadev.in';

// --- pure helpers ----------------------------------------------------------

// Body sent to Dev.to: everything after the closing frontmatter fence, with
// relative links absolutised (Dev.to has no notion of our routes).
export function toDevtoBody(mdx) {
  const lines = mdx.replace(/\r\n/g, '\n').split('\n');
  let fences = 0;
  let start = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      fences++;
      if (fences === 2) { start = i + 1; break; }
    }
  }
  return lines.slice(start).join('\n').replace(/\]\(\//g, `](${SITE}/`).trim();
}

export function readFrontmatterValue(mdx, key) {
  const m = mdx.match(new RegExp(`^${key}:\\s*"?([^"\\n]+)"?\\s*$`, 'm'));
  return m ? m[1].trim() : null;
}

// --- the guard -------------------------------------------------------------

export class RefuseError extends Error {}

async function json(fetchImpl, url, key, init = {}) {
  const res = await fetchImpl(url, {
    ...init,
    headers: { 'api-key': key, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Dev.to ${init.method ?? 'GET'} ${res.status}: ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : null;
}

// Look the article up in the AUTHENTICATED list. Deliberately NOT
// GET /articles/<id>: that endpoint serves published articles only, so it 404s
// for a genuine draft - which is Mode C's normal case. me/all covers both states.
export async function fetchOwnArticle({ id, key, fetchImpl }) {
  const list = await json(fetchImpl, `${API}/articles/me/all?per_page=100`, key);
  return (Array.isArray(list) ? list : []).find((a) => a.id === id) ?? null;
}

// Update the body, preserving `published` exactly. Throws RefuseError rather
// than guessing whenever the current state cannot be established.
export async function syncArticle({ id, bodyMarkdown, key, fetchImpl = fetch }) {
  if (!Number.isInteger(id)) throw new RefuseError(`refuse: devtoId must be an integer, got ${id}`);
  if (!bodyMarkdown?.trim()) throw new RefuseError('refuse: empty body_markdown');

  const before = await fetchOwnArticle({ id, key, fetchImpl });
  if (!before) {
    throw new RefuseError(
      `refuse: article ${id} is not in /articles/me/all - cannot establish its published state, so a PUT could flip it. Check the devtoId.`,
    );
  }

  const wasPublished = before.published === true;

  // The whole point: echo the fetched value back. Omitting `published` lets
  // Dev.to default it to true; hardcoding false delists a live article.
  const payload = { article: { body_markdown: bodyMarkdown, published: wasPublished } };

  const updated = await json(fetchImpl, `${API}/articles/${id}`, key, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  // Safety net: re-read from me/all (NOT me/unpublished - that cannot see a
  // published article, so it could not detect the failure we care about).
  const after = await fetchOwnArticle({ id, key, fetchImpl });
  const nowPublished = (after ?? updated)?.published === true;
  if (nowPublished !== wasPublished) {
    throw new Error(
      `ALARM: published changed ${wasPublished} -> ${nowPublished} for article ${id}. ` +
        `Restore it manually at https://dev.to/dashboard - do NOT re-run this script.`,
    );
  }

  return { id, published: wasPublished, sentPublished: wasPublished, verified: true };
}

// --- CLI -------------------------------------------------------------------

function readKey() {
  const p = join(homedir(), '.devto_api_key');
  if (!existsSync(p)) throw new RefuseError('refuse: ~/.devto_api_key missing');
  return readFileSync(p, 'utf8').trim(); // never logged
}

async function main(argv) {
  const slug = argv.find((a) => !a.startsWith('-'));
  const commit = argv.includes('--commit');
  if (!slug) {
    console.error('usage: node apps/devto-sync/sync.mjs <slug> [--commit]');
    process.exit(1);
  }

  const mdxPath = join(process.cwd(), 'site/content/posts', `${slug}.mdx`);
  if (!existsSync(mdxPath)) throw new RefuseError(`refuse: ${mdxPath} not found`);
  const mdx = readFileSync(mdxPath, 'utf8');

  const rawId = readFrontmatterValue(mdx, 'devtoId');
  if (!rawId) throw new RefuseError(`refuse: ${slug}.mdx has no devtoId - nothing to sync`);
  const id = Number.parseInt(rawId, 10);

  const key = readKey();
  const body = toDevtoBody(mdx);

  const before = await fetchOwnArticle({ id, key, fetchImpl: fetch });
  if (!before) throw new RefuseError(`refuse: article ${id} not in /articles/me/all`);

  console.log(`article ${id}  published=${before.published}  "${before.title}"`);
  console.log(`body: ${body.length} chars`);

  if (!commit) {
    console.log('\ndry-run. Re-run with --commit to PUT.');
    console.log(`published will be SENT AS ${before.published} (unchanged).`);
    return;
  }

  const out = await syncArticle({ id, bodyMarkdown: body, key, fetchImpl: fetch });
  console.log(`updated. published=${out.published} (unchanged, verified).`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main(process.argv.slice(2)).catch((err) => {
    console.error(err instanceof RefuseError ? err.message : `error: ${err.message}`);
    process.exit(1);
  });
}
