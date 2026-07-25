#!/usr/bin/env node
// text-hygiene: detect and fix banned characters (emoji, em-dashes, smart
// punctuation, zero-width / UCS-2-forcing characters) across authored repo
// content, and provide a GSM-7 lens for outbound SMS/email content.
//
// Ported from novacrm (tooling/scripts/text-hygiene.mjs). Single source of truth
// for the banned set AND the ignore list. Consumed here by: `npm run hygiene`
// (--all) and the .git/hooks/pre-commit gate (--staged). Keeps blog + social
// content ASCII-clean so em-dashes/emoji/smart-quotes don't leak into posts,
// social copy, or SMS-bound text (see the GSM-7 lens, --gsm7).
//
// This source file is deliberately ASCII-only: every banned character is
// referenced by numeric code point (0xXXXX) or \uXXXX escape, never as a
// literal glyph. So the engine passes its own check and needs no self-exclusion.
//
// Dependency-free Node ESM. No build step. Run with `node` or `tsx`.

import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// ---------------------------------------------------------------------------
// Tables (all keyed by numeric Unicode code point - ASCII-only source)
// ---------------------------------------------------------------------------

// Typographic footguns: characters that LLM output and word processors inject,
// each force UCS-2 in SMS, and each has a safe ASCII equivalent. These are
// TRANSLITERATED. Map<codePoint, replacementString>. (Range-based families -
// general-punctuation spaces and fullwidth forms - are handled in classify().)
const TRANSLITERATE = new Map([
  // Dashes / hyphens -> ASCII hyphen-minus
  [0x2010, '-'], // HYPHEN
  [0x2011, '-'], // NON-BREAKING HYPHEN
  [0x2012, '-'], // FIGURE DASH
  [0x2013, '-'], // EN DASH
  [0x2014, '-'], // EM DASH
  [0x2015, '-'], // HORIZONTAL BAR
  [0x2212, '-'], // MINUS SIGN
  [0x2027, '-'], // HYPHENATION POINT
  // Single quotes / apostrophes -> ASCII apostrophe (0x27)
  [0x2018, "'"], // LEFT SINGLE QUOTATION MARK
  [0x2019, "'"], // RIGHT SINGLE QUOTATION MARK
  [0x201a, "'"], // SINGLE LOW-9 QUOTATION MARK
  [0x201b, "'"], // SINGLE HIGH-REVERSED-9 QUOTATION MARK
  [0x2032, "'"], // PRIME
  [0x2035, "'"], // REVERSED PRIME
  [0x2039, "'"], // SINGLE LEFT-POINTING ANGLE QUOTATION MARK
  [0x203a, "'"], // SINGLE RIGHT-POINTING ANGLE QUOTATION MARK
  [0x02bc, "'"], // MODIFIER LETTER APOSTROPHE
  [0x00b4, "'"], // ACUTE ACCENT
  // Double quotes -> ASCII quotation mark (0x22)
  [0x201c, '"'], // LEFT DOUBLE QUOTATION MARK
  [0x201d, '"'], // RIGHT DOUBLE QUOTATION MARK
  [0x201e, '"'], // DOUBLE LOW-9 QUOTATION MARK
  [0x201f, '"'], // DOUBLE HIGH-REVERSED-9 QUOTATION MARK
  [0x2033, '"'], // DOUBLE PRIME
  [0x2034, '"'], // TRIPLE PRIME
  [0x00ab, '"'], // LEFT-POINTING DOUBLE ANGLE QUOTATION MARK
  [0x00bb, '"'], // RIGHT-POINTING DOUBLE ANGLE QUOTATION MARK
  // Ornamental quotation marks (live inside the Dingbats emoji range; mapped
  // here so they are transliterated as quotes, not stripped as pictographs).
  [0x275b, "'"], // HEAVY SINGLE TURNED COMMA QUOTATION MARK ORNAMENT
  [0x275c, "'"], // HEAVY SINGLE COMMA QUOTATION MARK ORNAMENT
  [0x275d, '"'], // HEAVY DOUBLE TURNED COMMA QUOTATION MARK ORNAMENT
  [0x275e, '"'], // HEAVY DOUBLE COMMA QUOTATION MARK ORNAMENT
  [0x276e, '"'], // HEAVY LEFT-POINTING ANGLE QUOTATION MARK ORNAMENT
  [0x276f, '"'], // HEAVY RIGHT-POINTING ANGLE QUOTATION MARK ORNAMENT
  // Ellipsis / leaders / bullets
  [0x2026, '...'], // HORIZONTAL ELLIPSIS
  [0x2024, '.'], // ONE DOT LEADER
  [0x2025, '..'], // TWO DOT LEADER
  [0x2022, '*'], // BULLET
  [0x2023, '*'], // TRIANGULAR BULLET
  [0x2043, '*'], // HYPHEN BULLET
  // NOTE: U+00B7 MIDDLE DOT is intentionally NOT banned here. novacrm bans it
  // (forces UCS-2 in SMS), but adityadev.in has no SMS and uses it as a web
  // separator (date · tags in OG images, the CV contact line). Keep it.
  // Non-U+0020 spaces outside the U+2000..U+200A block -> regular space
  [0x00a0, ' '], // NO-BREAK SPACE
  [0x202f, ' '], // NARROW NO-BREAK SPACE
  [0x205f, ' '], // MEDIUM MATHEMATICAL SPACE
  [0x3000, ' '], // IDEOGRAPHIC SPACE
  // Symbols with a conventional ASCII expansion
  [0x2044, '/'], // FRACTION SLASH
  [0x00a9, '(C)'], // COPYRIGHT SIGN
  [0x00ae, '(R)'], // REGISTERED SIGN
  [0x2122, '(TM)'], // TRADE MARK SIGN
  // Project-local (adityadev.in): the section sign is only ever a spec
  // cross-ref here (SPEC S6 style). ASCII it. novacrm keeps it: valid GSM-7.
  [0x00a7, 'S'], // SECTION SIGN -> S
]);

// Zero-width / invisible formatting characters: stripped (replaced with '').
// Includes the bidi control / directional characters behind Trojan-Source
// attacks - pure invisible payload with no place in authored content.
const STRIP_CHARS = new Set([
  0x00ad, // SOFT HYPHEN
  0x200b, // ZERO WIDTH SPACE
  0x200c, // ZERO WIDTH NON-JOINER
  0x200d, // ZERO WIDTH JOINER
  0x200e, // LEFT-TO-RIGHT MARK
  0x200f, // RIGHT-TO-LEFT MARK
  0x202a, // LEFT-TO-RIGHT EMBEDDING
  0x202b, // RIGHT-TO-LEFT EMBEDDING
  0x202c, // POP DIRECTIONAL FORMATTING
  0x202d, // LEFT-TO-RIGHT OVERRIDE
  0x202e, // RIGHT-TO-LEFT OVERRIDE
  0x2060, // WORD JOINER
  0x2066, // LEFT-TO-RIGHT ISOLATE
  0x2067, // RIGHT-TO-LEFT ISOLATE
  0x2068, // FIRST STRONG ISOLATE
  0x2069, // POP DIRECTIONAL ISOLATE
  0xfeff, // ZERO WIDTH NO-BREAK SPACE / BOM
]);

// Emoji / pictograph ranges: stripped. Inclusive [start, end] code-point pairs.
// Conservative set: well-known emoji blocks plus a curated list of unambiguous
// emoji code points that render as emoji on phones but sit outside the main
// blocks. Deliberately excludes dual-use math/technical/arrow symbols (e.g.
// U+2318, plain arrows U+2190..U+2193) that legitimately appear in docs.
const EMOJI_RANGES = [
  [0x1f000, 0x1faff], // pictographs, emoji, symbols & supplemental
  [0x2600, 0x26ff], // Miscellaneous Symbols
  [0x2700, 0x27bf], // Dingbats (heart, check, cross, sparkles, etc.)
  [0x2b00, 0x2bff], // Miscellaneous Symbols and Arrows (stars, etc.)
  [0xfe00, 0xfe0f], // Variation Selectors (emoji presentation)
  [0x20e3, 0x20e3], // COMBINING ENCLOSING KEYCAP
  // Curated unambiguous emoji outside the blocks above:
  [0x2139, 0x2139], // INFORMATION SOURCE
  [0x231a, 0x231b], // WATCH, HOURGLASS
  [0x2328, 0x2328], // KEYBOARD
  [0x23cf, 0x23cf], // EJECT SYMBOL
  [0x23e9, 0x23fa], // media-control + clock emoji
  [0x3030, 0x3030], // WAVY DASH
  [0x303d, 0x303d], // PART ALTERNATION MARK
  [0x3297, 0x3297], // CIRCLED IDEOGRAPH CONGRATULATION
  [0x3299, 0x3299], // CIRCLED IDEOGRAPH SECRET
];

function inEmojiRange(cp) {
  for (const [lo, hi] of EMOJI_RANGES) if (cp >= lo && cp <= hi) return true;
  return false;
}

// ---------------------------------------------------------------------------
// GSM-7 lens (for outbound SMS/email content - see standard doc)
// ---------------------------------------------------------------------------

// GSM 03.38 default alphabet + extension table, as the set of Unicode code
// points representable in a 7-bit SMS without forcing UCS-2. Anything outside
// this set forces the whole message into UCS-2 (160 -> 70 chars per segment).
// NOTE: this INCLUDES accented letters common in names (a-grave U+00E0, e-acute
// U+00E9, n-tilde U+00F1, ...) so the comms sanitizer must NOT strip them -
// that is the whole point of the GSM-7 lens.
const GSM7 = new Set([
  // ASCII letters and digits
  ...range(0x30, 0x39),
  ...range(0x41, 0x5a),
  ...range(0x61, 0x7a),
  // ASCII punctuation in the default alphabet
  0x20,
  0x21,
  0x22,
  0x23,
  0x24,
  0x25,
  0x26,
  0x27,
  0x28,
  0x29,
  0x2a,
  0x2b,
  0x2c,
  0x2d,
  0x2e,
  0x2f,
  0x3a,
  0x3b,
  0x3c,
  0x3d,
  0x3e,
  0x3f,
  0x40,
  0x5f,
  0x0a,
  0x0d, // LF, CR (the only control-like chars in the default alphabet)
  // Default-alphabet accented letters / symbols
  0x00a3,
  0x00a5,
  0x00e8,
  0x00e9,
  0x00f9,
  0x00ec,
  0x00f2,
  0x00c7,
  0x00d8,
  0x00f8,
  0x00c5,
  0x00e5,
  0x00c6,
  0x00e6,
  0x00df,
  0x00c9,
  0x00a4,
  0x00a1,
  0x00c4,
  0x00d6,
  0x00d1,
  0x00dc,
  0x00a7,
  0x00bf,
  0x00e4,
  0x00f6,
  0x00f1,
  0x00fc,
  0x00e0,
  // Greek capitals in the default alphabet
  0x0394,
  0x03a6,
  0x0393,
  0x039b,
  0x03a9,
  0x03a0,
  0x03a8,
  0x03a3,
  0x0398,
  0x039e,
  // Extension table (each costs 2 septets but stays GSM-7, not UCS-2)
  0x0c,
  0x5e,
  0x7b,
  0x7d,
  0x5c,
  0x5b,
  0x7e,
  0x5d,
  0x7c,
  0x20ac,
]);

function range(lo, hi) {
  const out = [];
  for (let i = lo; i <= hi; i++) out.push(i);
  return out;
}

function isGsm7CodePoint(cp) {
  return GSM7.has(cp);
}

// ---------------------------------------------------------------------------
// Core detection / transliteration (pure functions)
// ---------------------------------------------------------------------------

function classify(cp) {
  if (TRANSLITERATE.has(cp)) {
    return { category: 'typographic', suggestion: TRANSLITERATE.get(cp), action: 'transliterate' };
  }
  // Fullwidth ASCII forms U+FF01..U+FF5E -> their ASCII counterparts.
  if (cp >= 0xff01 && cp <= 0xff5e) {
    return {
      category: 'typographic',
      suggestion: String.fromCharCode(cp - 0xfee0),
      action: 'transliterate',
    };
  }
  // General-punctuation spaces U+2000..U+200A and line/paragraph separators.
  if ((cp >= 0x2000 && cp <= 0x200a) || cp === 0x2028 || cp === 0x2029) {
    return { category: 'typographic', suggestion: ' ', action: 'transliterate' };
  }
  if (STRIP_CHARS.has(cp)) {
    return { category: 'zero-width', suggestion: '', action: 'strip' };
  }
  if (inEmojiRange(cp)) {
    return { category: 'emoji', suggestion: '', action: 'strip' };
  }
  return null;
}

function cpHex(cp) {
  return `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`;
}

// Detect banned characters (authored-content lens). Returns findings with
// line/column (1-based) for human-readable reporting.
function detect(text) {
  const findings = [];
  let line = 1;
  let col = 1;
  for (const ch of text) {
    if (ch === '\n') {
      line += 1;
      col = 1;
      continue;
    }
    const cp = ch.codePointAt(0);
    const c = classify(cp);
    if (c) {
      findings.push({
        line,
        col,
        codePoint: cp,
        hex: cpHex(cp),
        category: c.category,
        action: c.action,
        suggestion: c.suggestion,
      });
    }
    col += 1;
  }
  return findings;
}

// Transliterate banned characters to ASCII (authored content + --fix). Leaves
// every other character (including valid accented letters) untouched.
function transliterate(text) {
  let out = '';
  for (const ch of text) {
    const cp = ch.codePointAt(0);
    const c = classify(cp);
    if (!c) out += ch;
    else if (c.action === 'transliterate') out += c.suggestion;
    // strip => append nothing
  }
  return out;
}

// GSM-7 lens (comms): flag anything not representable in GSM-7. Used by the
// future @novacrm/shared-text-hygiene comms sanitizer; exposed now via --gsm7.
function detectNonGsm7(text) {
  const findings = [];
  let line = 1;
  let col = 1;
  for (const ch of text) {
    if (ch === '\n') {
      line += 1;
      col = 1;
      continue;
    }
    const cp = ch.codePointAt(0);
    if (!isGsm7CodePoint(cp)) {
      const c = classify(cp);
      findings.push({
        line,
        col,
        codePoint: cp,
        hex: cpHex(cp),
        category: c ? c.category : 'non-gsm7',
        action: c ? c.action : 'review',
        suggestion: c ? c.suggestion : '',
      });
    }
    col += 1;
  }
  return findings;
}

// ---------------------------------------------------------------------------
// File handling
// ---------------------------------------------------------------------------

// Paths never scanned: binaries, generated output, vendored deps, lockfiles,
// and parity fixtures (which capture real Laravel responses verbatim and may
// legitimately contain non-ASCII / emoji from production data). This list is
// the single authority on exemptions - the Claude hook delegates here via
// --path rather than re-implementing its own globs.
const IGNORE_REGEXES = [
  /(^|\/)social-card\.mjs$/, // glyph-mapping renderer: legitimately holds the chars it swaps for Satori
  /\.min\.(js|css)$/, // vendored/minified assets - never rewrite third-party bundles
  /\.map$/, // source maps
  /(^|\/)node_modules\//,
  /(^|\/)dist\//,
  /(^|\/)\.git\//,
  /(^|\/)\.agents\//,
  /(^|\/)\.claude\/skills\//,
  /(^|\/)\.husky\/_\//,
  /(^|\/)pnpm-lock\.yaml$/,
  /(^|\/)package-lock\.json$/,
  /(^|\/)yarn\.lock$/,
  /\.tsbuildinfo$/,
  /(^|\/)tooling\/parity-tests\/.*fixtures?\//,
  /\.fixture\.[a-z]+$/,
  /\.snap$/,
  /\.(png|jpe?g|gif|webp|ico|svg|pdf|woff2?|ttf|eot|otf|mp4|mov|webm|zip|gz|tgz|tar|wasm|icns)$/i,
];

function isIgnored(path) {
  return IGNORE_REGEXES.some((re) => re.test(path));
}

// ---------------------------------------------------------------------------
// Phrase lens (--phrases): banned PHRASINGS and un-permissioned CLAIMS.
//
// A separate lens on purpose. The character lenses above are about typography
// and would drown a social pack in em-dash findings that nobody cares about;
// this one is about what the copy SAYS. Run it over ops/ (which is gitignored,
// so no pre-commit hook can ever see those files - the /post skill invokes this
// itself before its review gate).
//
// Sources: ops/voice.md's "Not me (never use)" list and its permissioned-numbers
// ALLOWLIST, plus ~/.claude/skills/post/human-voice.md's AI tells.
// A claim lands here when it appears in a draft but not on the allowlist.
// ---------------------------------------------------------------------------

const BANNED_PHRASES = [
  // --- AI vocabulary: ops/voice.md "Not me (never use)" ---
  { re: /\bdelve\w*\b/gi, category: 'ai-vocab', suggestion: 'say "dig into" or just say the thing' },
  { re: /\bleverag\w+\b/gi, category: 'ai-vocab', suggestion: 'use / with' },
  { re: /\bin today'?s landscape\b/gi, category: 'ai-vocab', suggestion: 'cut it' },
  { re: /\bunlocks?\b/gi, category: 'ai-vocab', suggestion: 'name what it actually lets you do' },
  { re: /\bsupercharg\w+\b/gi, category: 'ai-vocab', suggestion: 'cut it' },
  { re: /\bseamless(ly)?\b/gi, category: 'ai-vocab', suggestion: 'name the friction it removes' },
  { re: /\bgame[- ]chang\w+\b/gi, category: 'ai-vocab', suggestion: 'cut it' },
  { re: /\brobust\b/gi, category: 'ai-vocab', suggestion: 'say what it survives' },
  { re: /\bcrucial\b/gi, category: 'ai-vocab', suggestion: 'important, or cut' },

  // --- launch cosplay: human-voice.md ---
  { re: /\bI'?m (so )?excited to share\b/gi, category: 'launch-cosplay', suggestion: 'open on the thing itself' },
  { re: /\b(I'?m )?thrilled\b/gi, category: 'launch-cosplay', suggestion: 'cut it' },

  // --- round/safe numbers: human-voice.md:25 ("Predictable = high AI probability") ---
  { re: /\b\d{1,3}-\d{1,3}%/g, category: 'round-number', suggestion: 'one odd specific number, e.g. "about 1 in 8"' },
  // Spelled-out ranges too: a reel voiceover said "ten, fifteen percent" and the
  // digit pattern above sailed straight past it. Percentages hide in words.
  {
    re: /\b(one|two|three|four|five|six|seven|eight|nine|ten|fifteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)[, ]+(and )?(one|two|three|four|five|six|seven|eight|nine|ten|fifteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety) percent\b/gi,
    category: 'round-number',
    suggestion: 'a spelled-out range is still a range - use one odd specific number',
  },

  // --- un-permissioned claims: NOT on ops/voice.md's allowlist ---
  //
  // THIS BLOCK IS THE AUDIT RECORD. The 2026-07-25 audit found six claims sitting
  // in ops/social/posts/ai-automation-that-pays-for-itself/. All six were removed
  // from the drafts in b53b08d and each is a blocking pattern below, with its
  // provenance in the comment beside it. voice.md no longer carries that list:
  // a file the drafting model READS must contain zero quotable claims, even ones
  // marked prohibited, because a header saying "do not use" is not a control.
  // This file is the right home - it is read by no drafting skill and is exempt
  // from its own phrase lens (PHRASE_LENS_IGNORE below).
  //
  // Provenance of the first: an (e.g.) placeholder that used to sit in voice.md
  // and was lifted verbatim into linkedin.md:9 and x.md:39 as a client story.
  { re: /1 in 8 answers/gi, category: 'unpermissioned-claim', suggestion: 'add to voice.md allowlist or cut' },
  // Catch the reworded forms too. The literal "shipped four of these" was purged
  // from the drafts, and "four systems I've actually shipped" sailed straight past
  // a pattern that only matched the first phrasing. A claim is a claim in any word
  // order, so match the ASSERTION (a count + shipped), not one sentence.
  { re: /shipped four of these/gi, category: 'unpermissioned-claim', suggestion: 'add to voice.md allowlist or cut' },
  {
    re: /\b(four|\d+) [a-z ]{0,20}(systems?|of these|automations?|bots?)[a-z ,'-]{0,25}(I'?ve |I have )?(actually )?(shipped|built|delivered)\b/gi,
    category: 'unpermissioned-claim',
    suggestion: 'asserts a shipped COUNT - allowlist it or describe the article instead',
  },
  {
    re: /\b(I'?ve|I have) (actually )?shipped (four|\d+)\b/gi,
    category: 'unpermissioned-claim',
    suggestion: 'asserts a shipped COUNT - allowlist it or drop the number',
  },
  { re: /paid for (itself|themselves)/gi, category: 'unpermissioned-claim', suggestion: 'add to voice.md allowlist or cut' },
  { re: /drop(ped)? ~?\d+% overnight/gi, category: 'unpermissioned-claim', suggestion: 'add to voice.md allowlist or cut' },
  // The sixth audited claim: "A client messaged me six weeks after we shipped
  // their support bot" (linkedin.md:6-15, the opening scene). Not a number, but a
  // specific client interaction, which needs permission just the same. Matched
  // ASSERTION-shaped per the rule above: a client contact WITH a timeframe. A
  // vague "clients tell me" carries no specific interaction and stays legal, and
  // so does human-voice.md's own scene-setting guidance - it is a real moment
  // once you have permission for it, and this pattern is what makes you get it.
  {
    re: /\ba client (messaged|emailed|called|pinged|texted|reached out to) me[a-z ,'-]{0,20}(a |two |three |four |five |six |\d+ )?(day|week|month)s?\b/gi,
    category: 'unpermissioned-claim',
    suggestion: 'a dated client interaction needs permission - allowlist it, or drop the timeframe and the client',
  },
];

// Files that DEFINE the banned set necessarily contain it, so the phrase lens
// exempts them - exactly as this source file avoids literal banned glyphs so it
// passes its own character check. Kept separate from IGNORE_REGEXES because
// these files SHOULD still be scanned for typography.
const PHRASE_LENS_IGNORE = [
  /(^|\/)voice\.md$/,
  /(^|\/)human-voice\.md$/,
  /(^|\/)text-hygiene\.mjs$/,
];

export function isPhraseLensExempt(path) {
  return PHRASE_LENS_IGNORE.some((re) => re.test(path));
}

export function detectPhrases(text) {
  const findings = [];
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  for (let i = 0; i < lines.length; i++) {
    for (const { re, category, suggestion } of BANNED_PHRASES) {
      re.lastIndex = 0; // shared regex objects: reset between lines
      let m;
      while ((m = re.exec(lines[i])) !== null) {
        findings.push({
          line: i + 1,
          col: m.index + 1,
          match: m[0],
          category,
          action: 'rewrite',
          suggestion,
        });
        if (m[0].length === 0) re.lastIndex++; // guard against a zero-width match looping
      }
    }
  }
  // Several patterns deliberately overlap (the same shipped-count claim is caught
  // by a literal AND two generalised forms), so collapse overlapping spans on the
  // same line to one finding. Otherwise a single sentence reports three times and
  // the count stops meaning "how many problems".
  findings.sort((a, b) => a.line - b.line || a.col - b.col || b.match.length - a.match.length);
  const kept = [];
  for (const f of findings) {
    const covered = kept.some(
      (k) => k.line === f.line && f.col < k.col + k.match.length && f.col + f.match.length > k.col,
    );
    if (!covered) kept.push(f);
  }
  return kept;
}

// Recursive file walk, for trees git cannot enumerate. ops/social/ is
// .gitignore line 7, so --all (git ls-files) can never reach the social packs.
function walkDir(dir, out = []) {
  let names;
  try {
    names = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const d of names) {
    const p = join(dir, d.name);
    if (d.isDirectory()) walkDir(p, out);
    else if (d.isFile() && /\.(md|mdx|txt|json)$/i.test(d.name)) out.push(p);
  }
  return out;
}

// Treat a buffer as binary (and skip) if it contains a NUL byte in the first 8KB.
function looksBinary(buf) {
  const n = Math.min(buf.length, 8192);
  for (let i = 0; i < n; i++) if (buf[i] === 0) return true;
  return false;
}

function bufToText(buf) {
  if (looksBinary(buf)) return null;
  return buf.toString('utf8');
}

function readText(path) {
  try {
    if (!statSync(path).isFile()) return null;
  } catch {
    return null;
  }
  return bufToText(readFileSync(path));
}

// Read a file's STAGED blob content (index version), so the pre-commit gate
// scans exactly what is about to be committed, not the working-tree copy.
function readStagedBlob(path) {
  try {
    const buf = execFileSync('git', ['-c', 'core.quotePath=false', 'show', `:${path}`], {
      maxBuffer: 64 * 1024 * 1024,
    });
    return bufToText(buf);
  } catch {
    return null;
  }
}

// Run a git command and return the path list. THROWS on a git error (unlike a
// swallow-and-return-[] helper) so selector modes can fail closed. Callers pass
// `-z` so output is NUL-delimited; `core.quotePath=false` keeps non-ASCII paths
// raw (otherwise git C-quotes them and the path no longer matches `git show
// :path` or the filesystem - silently skipping the file).
function gitLines(args) {
  const out = execFileSync('git', ['-c', 'core.quotePath=false', ...args], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  return out.split(/[\0\n]/).filter(Boolean);
}

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

function formatFinding(path, f) {
  if (f.action === 'rewrite') {
    return `  ${path}:${f.line}:${f.col}  ${JSON.stringify(f.match)} (${f.category})  ->  ${f.suggestion}`;
  }
  const sug =
    f.action === 'transliterate'
      ? `replace with ${JSON.stringify(f.suggestion)}`
      : f.action === 'strip'
        ? 'remove'
        : 'review (not GSM-7)';
  return `  ${path}:${f.line}:${f.col}  ${f.hex} (${f.category})  ->  ${sug}`;
}

// ---------------------------------------------------------------------------
// Self-test (glyphs here are normalized to \u escapes at authoring time)
// ---------------------------------------------------------------------------

function selftest() {
  const cases = [];
  const assert = (name, cond) => cases.push({ name, ok: !!cond });

  // Detection
  assert('flags em dash', detect('a\u2014b').length === 1);
  assert('flags curly double quotes', detect('\u201Chi\u201D').length === 2);
  assert('flags ellipsis', detect('wait\u2026').length === 1);
  assert('flags emoji', detect('ok\u{1F600}').length === 1);
  assert('flags nbsp', detect('a\u00A0b').length === 1);
  assert('flags em space', detect('a\u2003b').length === 1);
  assert('flags single guillemet', detect('\u2039x\u203A').length === 2);
  assert('flags fullwidth bang', detect('hi\uFF01').length === 1);
  assert('flags RLO bidi control', detect('a\u202Eb').length === 1);
  assert('flags zero-width space', detect('a\u200Bb').length === 1);
  assert('flags watch emoji (outside main blocks)', detect('\u231A').length === 1);
  assert('clean ASCII has no findings', detect('plain - \'q\' "q" ...').length === 0);
  assert('does not flag accented name (e-acute)', detect('Jos\u00E9').length === 0);
  assert('does not flag pound or euro', detect('\u00A3 \u20AC').length === 0);
  assert('does not flag plain arrow (dual-use)', detect('a\u2192b').length === 0);

  // Transliteration
  assert('em dash -> hyphen', transliterate('a\u2014b') === 'a-b');
  assert('curly quotes -> straight', transliterate('\u201Chi\u201D') === '"hi"');
  assert('apostrophe -> straight', transliterate('it\u2019s') === "it's");
  assert('ellipsis -> three dots', transliterate('no\u2026') === 'no...');
  assert('emoji stripped', transliterate('hi \u{1F44D}') === 'hi ');
  assert('nbsp -> space', transliterate('a\u00A0b') === 'a b');
  assert('em space -> space', transliterate('a\u2003b') === 'a b');
  assert('fullwidth bang -> ascii', transliterate('hi\uFF01') === 'hi!');
  assert('single guillemets -> apostrophes', transliterate('\u2039x\u203A') === "'x'");
  assert('ornamental quote -> apostrophe', transliterate('\u275Bx\u275C') === "'x'");
  assert('RLO bidi control stripped', transliterate('a\u202Eb') === 'ab');
  assert('zero-width stripped', transliterate('a\u200Bb') === 'ab');
  assert('accented letter preserved', transliterate('Jos\u00E9') === 'Jos\u00E9');
  assert('TM -> (TM)', transliterate('Nova\u2122') === 'Nova(TM)');
  assert('section sign -> S', transliterate('SPEC ' + String.fromCharCode(0xa7) + '6') === 'SPEC S6');

  // Phrase lens
  assert('flags the banned round number', detectPhrases('about 10-15% wrong').length === 1);
  assert('flags an un-permissioned claim', detectPhrases('getting 1 in 8 answers wrong').length === 1);
  assert('flags "paid for themselves"', detectPhrases('A couple paid for themselves inside a month.').length === 1);
  assert('flags "shipped four of these"', detectPhrases("I've shipped four of these now.").length === 1);
  assert('flags overnight-drop claim', detectPhrases('I watched one drop ~12% overnight.').length === 1);
  assert('flags ai-vocab', detectPhrases('This will unlock seamless delivery').length === 2);
  assert('phrase lens ignores typography', detectPhrases('an em\u2014dash and \u201Cquotes\u201D').length === 0);
  assert('clean copy has no phrase findings', detectPhrases('Order-status replies. First-pass triage.').length === 0);
  assert('phrase findings report line and col', detectPhrases('ok\nthrilled').every((f) => f.line > 0 && f.col > 0));
  assert('repeated match found twice on one line', detectPhrases('unlock and unlock').length === 2);
  assert('flags the REWORDED shipped-count claim', detectPhrases("four systems I've actually shipped").length >= 1);
  assert('flags "I have shipped four"', detectPhrases("I've shipped four of them").length >= 1);
  assert('does not flag describing the article', detectPhrases('Wrote up four of these systems in detail').length === 0);
  assert('flags a SPELLED-OUT range', detectPhrases('getting ten, fifteen percent of answers wrong').length === 1);
  assert('does not flag a single spelled-out percentage', detectPhrases('about ten percent of them').length === 0);

  // GSM-7 lens
  assert('e-acute is GSM-7 (not flagged)', detectNonGsm7('caf\u00E9').length === 0);
  assert('em dash is not GSM-7', detectNonGsm7('a\u2014b').length === 1);
  assert('emoji is not GSM-7', detectNonGsm7('hi \u{1F600}').length === 1);
  assert('plain ASCII is GSM-7', detectNonGsm7('Hello, world! 123').length === 0);
  assert('backtick is not GSM-7', detectNonGsm7('`x`').length === 2);
  assert('tab is not GSM-7', detectNonGsm7('a\tb').length === 1);

  const failed = cases.filter((c) => !c.ok);
  for (const c of cases) process.stdout.write(`${c.ok ? 'ok  ' : 'FAIL'} ${c.name}\n`);
  if (failed.length) {
    process.stderr.write(`\ntext-hygiene selftest: ${failed.length} failure(s)\n`);
    process.exit(1);
  }
  process.stdout.write(`\ntext-hygiene selftest: ${cases.length} passed\n`);
  process.exit(0);
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function usage() {
  process.stdout.write(
    `${[
      'Usage: node scripts/text-hygiene.mjs [options] [files...]',
      '',
      '  (files...)        scan the given files',
      '  --all             scan all git-tracked files',
      '  --staged          scan files staged for commit (reads the staged blob)',
      '  --diff <base>     scan files changed vs <base> (e.g. origin/main)',
      '  --stdin           scan content from stdin',
      '  --path <file>     in --stdin mode, skip if <file> is on the ignore list',
      '  --fix             rewrite scanned files, transliterating banned chars',
      '  --gsm7            use the GSM-7 lens (flag all non-GSM-7 chars)',
      '  --phrases         use the PHRASE lens instead of the character lenses:',
      '                    banned phrasings + un-permissioned claims. Needs judgment,',
      '                    so --fix is refused. Sources: ops/voice.md allowlist +',
      '                    human-voice.md tells.',
      '  --dir <path>      walk a directory tree (reaches gitignored trees like',
      '                    ops/social/, which git ls-files cannot enumerate)',
      '',
      '  Social pack check:  node scripts/text-hygiene.mjs --phrases --dir ops/social',
      '  --selftest        run built-in assertions and exit',
      '  --quiet           print only the violation count',
      '',
      'Exit codes: 0 clean, 1 banned characters found, 2 git/IO failure.',
    ].join('\n')}\n`,
  );
}

function parseArgs(argv) {
  const opts = {
    files: [],
    all: false,
    staged: false,
    diff: null,
    stdin: false,
    path: null,
    fix: false,
    gsm7: false,
    phrases: false,
    dir: null,
    selftest: false,
    quiet: false,
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--all') opts.all = true;
    else if (a === '--staged') opts.staged = true;
    else if (a === '--diff') opts.diff = argv[++i] || 'origin/main';
    else if (a === '--stdin') opts.stdin = true;
    else if (a === '--path') opts.path = argv[++i] || null;
    else if (a === '--fix') opts.fix = true;
    else if (a === '--gsm7') opts.gsm7 = true;
    else if (a === '--phrases') opts.phrases = true;
    else if (a === '--dir') opts.dir = argv[++i] || null;
    else if (a === '--selftest') opts.selftest = true;
    else if (a === '--quiet') opts.quiet = true;
    else if (a === '-h' || a === '--help') opts.help = true;
    else opts.files.push(a);
  }
  return opts;
}

function readStdin() {
  try {
    return readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) return usage();
  if (opts.selftest) return selftest();

  // --phrases is a REPLACEMENT lens, not an addition: running the typography
  // lenses over ops/ would bury the claim findings under em-dash noise.
  if (opts.phrases && opts.fix) {
    process.stderr.write('text-hygiene: --fix does not apply to --phrases (these need judgment, not transliteration).\n');
    process.exit(2);
  }
  const scan = opts.phrases ? detectPhrases : opts.gsm7 ? detectNonGsm7 : detect;
  const unit = opts.phrases ? 'banned phrase / un-permissioned claim' : 'banned character';

  // stdin mode: used by the Claude PreToolUse hook. Reports and exits 1 on any
  // finding (the bash hook maps that to a block with exit 2). --path lets the
  // hook delegate exemptions to IGNORE_REGEXES (single source of truth).
  if (opts.stdin) {
    if (opts.path && isIgnored(opts.path)) process.exit(0);
    const text = readStdin();
    const findings = scan(text);
    if (findings.length) {
      if (opts.quiet) process.stdout.write(`${String(findings.length)}\n`);
      else {
        process.stdout.write(`Found ${findings.length} banned character(s):\n`);
        for (const f of findings)
          process.stdout.write(`${formatFinding(opts.path || '<stdin>', f)}\n`);
      }
      process.exit(1);
    }
    process.exit(0);
  }

  // Resolve the file list. Selector git calls FAIL CLOSED: if git errors (bad
  // base SHA, shallow clone, missing ref) we exit 2 rather than scan nothing
  // and report clean.
  const entries = opts.files.map((p) => ({ path: p, staged: false }));
  // --dir walks the filesystem, so it reaches gitignored trees (ops/social/).
  if (opts.dir) for (const p of walkDir(opts.dir)) entries.push({ path: p, staged: false });
  try {
    if (opts.all)
      for (const p of gitLines(['ls-files', '-z'])) entries.push({ path: p, staged: false });
    if (opts.staged)
      for (const p of gitLines(['diff', '--cached', '--name-only', '--diff-filter=ACM', '-z']))
        entries.push({ path: p, staged: true });
    if (opts.diff)
      for (const p of gitLines([
        'diff',
        '--name-only',
        '--diff-filter=ACM',
        '-z',
        `${opts.diff}...HEAD`,
      ]))
        entries.push({ path: p, staged: false });
  } catch (e) {
    process.stderr.write(
      `text-hygiene: git failed resolving the file list (${e?.message || e}).\n`,
    );
    process.stderr.write(
      'Refusing to report clean on a git error. Check the base ref / fetch-depth.\n',
    );
    process.exit(2);
  }

  // Dedupe by path (first occurrence wins; a staged entry keeps its staged flag).
  const seen = new Set();
  const files = entries.filter((e) => !isIgnored(e.path) && !seen.has(e.path) && seen.add(e.path));

  let totalFindings = 0;
  let scannedFiles = 0;
  let fixedFiles = 0;
  const report = [];

  for (const entry of files) {
    if (opts.phrases && isPhraseLensExempt(entry.path)) continue;
    // For gating (detection), staged files are read from the index blob. For
    // --fix we operate on the working tree (you fix files on disk).
    const text = entry.staged && !opts.fix ? readStagedBlob(entry.path) : readText(entry.path);
    if (text === null) continue;
    scannedFiles += 1;

    if (opts.fix && !opts.gsm7) {
      const fixed = transliterate(text);
      if (fixed !== text) {
        writeFileSync(entry.path, fixed);
        fixedFiles += 1;
      }
      const left = detect(fixed);
      if (left.length) {
        totalFindings += left.length;
        report.push(`${entry.path}:`);
        for (const f of left) report.push(formatFinding(entry.path, f));
      }
      continue;
    }

    const findings = scan(text);
    if (findings.length) {
      totalFindings += findings.length;
      report.push(`${entry.path}:`);
      for (const f of findings) report.push(formatFinding(entry.path, f));
    }
  }

  if (opts.quiet) {
    process.stdout.write(`${String(totalFindings)}\n`);
  } else if (totalFindings > 0) {
    process.stderr.write(
      `text-hygiene: ${totalFindings} ${unit}(s) in ${scannedFiles} scanned file(s)\n`,
    );
    process.stderr.write(`${report.join('\n')}\n`);
    process.stderr.write(
      opts.phrases
        ? '\nThese need judgment, not a codemod. Rewrite the copy, or add a claim to the\n"Numbers I can cite" allowlist in ops/voice.md if it is true and permissioned.\n'
        : '\nFix with: node scripts/text-hygiene.mjs --fix <files>  (or: npm run hygiene:fix)\n',
    );
  } else if (opts.fix) {
    process.stdout.write(`text-hygiene: transliterated ${fixedFiles} file(s); clean.\n`);
  } else {
    process.stdout.write(`text-hygiene: ${scannedFiles} file(s) scanned, clean.\n`);
  }

  process.exit(totalFindings > 0 ? 1 : 0);
}

main();
