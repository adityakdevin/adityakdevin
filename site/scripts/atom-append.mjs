#!/usr/bin/env node
// atom-append - add a shipped atom to an accumulating canonical draft.
//
//   cd site
//   bun run atom -- <draft-slug> \
//     --claim "18k -> 4k tokens by scoping the file globs" \
//     --failure "scope too tight and you drop the file the answer was in" \
//     --verify "run it twice, diff the token count in the status line" \
//     [--source x-thread] [--title "Token tricks"] [--tags AI,Claude]
//
// Creates the draft on first use (always with `published: false`) and appends
// thereafter. The draft stays out of /blog, the sitemap and RSS until you flip
// that flag by hand - lib/posts.ts gates on it inside getAllPosts().
//
// ponytail: no deps, no arg-parser library. The logic lives in lib/atoms.ts so it
// is tested by vitest alongside the loader it has to stay honest with.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { buildDraftMdx, appendAtom, countAtoms, isDraft } from "../lib/atoms.ts";

const POSTS_DIR = path.join(import.meta.dirname, "..", "content", "posts");

function arg(argv, name) {
  const i = argv.indexOf(`--${name}`);
  return i !== -1 ? argv[i + 1] : undefined;
}

function main(argv) {
  const slug = argv.find((a) => !a.startsWith("--") && !argv[argv.indexOf(a) - 1]?.startsWith("--"));
  if (!slug) {
    console.error("usage: bun run atom -- <draft-slug> --claim <c> --failure <f> --verify <v> [--source s]");
    process.exit(1);
  }

  const atom = {
    claim: arg(argv, "claim") ?? "",
    failureMode: arg(argv, "failure") ?? "",
    verification: arg(argv, "verify") ?? "",
    date: new Date().toISOString().slice(0, 10),
    ...(arg(argv, "source") ? { source: arg(argv, "source") } : {}),
  };

  mkdirSync(POSTS_DIR, { recursive: true });
  const file = path.join(POSTS_DIR, `${slug}.mdx`);

  let mdx;
  if (existsSync(file)) {
    mdx = readFileSync(file, "utf-8");
    if (!isDraft(mdx)) {
      console.error(`${slug}.mdx is PUBLISHED - it is live at /blog/${slug}, in the sitemap and in RSS.`);
      console.error("Edit it deliberately, or start a new accumulating draft under a different slug.");
      process.exit(1);
    }
  } else {
    const title = arg(argv, "title") ?? slug.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase());
    mdx = buildDraftMdx({
      slug,
      title,
      description: arg(argv, "description") ?? `Accumulating notes: ${title.toLowerCase()}.`,
      date: atom.date,
      tags: (arg(argv, "tags") ?? "AI").split(",").map((t) => t.trim()).filter(Boolean),
    });
    console.log(`created draft ${slug}.mdx (published: false)`);
  }

  let out;
  try {
    out = appendAtom(mdx, atom);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }

  writeFileSync(file, out);
  const n = countAtoms(out);
  console.log(`appended atom ${n} to ${slug}.mdx`);
  console.log(
    n >= 5
      ? `\n${n} atoms accumulated. That is an article - rewrite the sections into prose,\nthen delete the "published: false" line to ship it.`
      : `\n${n} atom(s) so far. Still a draft; invisible to /blog, sitemap and RSS.`,
  );
}

main(process.argv.slice(2));
