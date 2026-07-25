/**
 * Atom accumulation (Stage 3).
 *
 * The content spine is atomic now - tips, prompts, token-reduction techniques,
 * agent workflows. Those ship as social posts immediately via `/post --topic`,
 * with no article. This module is the other half: each atom is also appended to a
 * canonical DRAFT, and when enough have piled up the draft becomes a real article.
 * The long-form piece is the batch byproduct of shipped atoms rather than a
 * precondition for shipping any of them.
 *
 * The safety property: a draft under content/posts/ is a live route the moment it
 * exists, because there is no draft state in Next's routing. So every draft this
 * module creates carries `published: false`, and lib/posts.ts filters on it inside
 * getAllPosts(). Both halves are tested; neither is a convention.
 */

export type Atom = {
  claim: string; // must contain a real number
  failureMode: string;
  verification: string;
  date: string; // yyyy-mm-dd
  source?: string; // where it shipped, e.g. a slug or a URL
};

export type DraftMeta = {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
};

/** The same three fields /post enforces. Kept here too so a draft cannot
 *  accumulate an atom that would have been rejected as a social post. */
export function atomProblems(atom: Partial<Atom>): string[] {
  const problems: string[] = [];
  if (!atom.claim?.trim()) problems.push("claim is missing");
  else if (!/\d/.test(atom.claim)) problems.push(`claim has no number in it: "${atom.claim}"`);
  if (!atom.failureMode?.trim()) problems.push("failureMode is missing");
  if (!atom.verification?.trim()) problems.push("verification is missing");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(atom.date ?? "")) problems.push(`date must be yyyy-mm-dd, got "${atom.date}"`);
  return problems;
}

/** One atom as a markdown section. Deliberately plain: the draft is a working
 *  document, and the human rewrites it into prose before it ever publishes. */
export function renderAtom(atom: Atom): string {
  const heading = atom.claim.replace(/\s+/g, " ").trim();
  const lines = [
    `## ${heading}`,
    "",
    `**Where it breaks:** ${atom.failureMode.trim()}`,
    "",
    `**Check it in 10 seconds:** ${atom.verification.trim()}`,
    "",
    `<!-- atom: ${atom.date}${atom.source ? ` | shipped as ${atom.source}` : ""} -->`,
  ];
  return lines.join("\n");
}

/** A fresh accumulating draft. `published: false` is not optional and not a
 *  parameter - a caller must not be able to create a live stub by omission. */
export function buildDraftMdx(meta: DraftMeta): string {
  const tags = meta.tags.map((t) => `"${t}"`).join(", ");
  return [
    "---",
    `title: "${meta.title}"`,
    `description: "${meta.description}"`,
    `date: "${meta.date}"`,
    `tags: [${tags}]`,
    "published: false",
    "---",
    "",
    "<!-- Accumulating draft. Atoms are appended below as they ship.",
    "     Flip `published` to true (or delete the line) when this is a real article:",
    "     rewrite the sections into prose first - these are raw notes, not copy. -->",
    "",
  ].join("\n");
}

/** True when the MDX explicitly marks itself unpublished. */
export function isDraft(mdx: string): boolean {
  return /^published:\s*false\s*$/m.test(mdx);
}

/** Count the atoms already accumulated, via the trailing marker comment. */
export function countAtoms(mdx: string): number {
  return (mdx.match(/^<!-- atom: \d{4}-\d{2}-\d{2}/gm) ?? []).length;
}

/**
 * Append an atom to an accumulating draft.
 *
 * Refuses on a PUBLISHED article: appending raw notes to something already live
 * would push unreviewed text straight onto the site and into the feed. Promotion
 * is a human action, and so is editing a promoted piece.
 */
export function appendAtom(mdx: string, atom: Atom): string {
  const problems = atomProblems(atom);
  if (problems.length) {
    throw new Error(`refusing to append an incomplete atom:\n  - ${problems.join("\n  - ")}`);
  }
  if (!isDraft(mdx)) {
    throw new Error(
      "refusing to append to a PUBLISHED post - it is live at /blog, in the sitemap and in RSS. " +
        "Edit it deliberately, or start a new accumulating draft.",
    );
  }
  return `${mdx.replace(/\s*$/, "")}\n\n${renderAtom(atom)}\n`;
}
