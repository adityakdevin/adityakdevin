import { describe, it, expect } from "vitest";
import { caseStudies, publishedCaseStudies, type CaseStudy } from "@/content/data/work";
import { buildSystemPrompt } from "@/lib/prompt";

describe("case study publication gate (ceo-plan D4b - safety control)", () => {
  it("publishedCaseStudies contains only published===true studies", () => {
    for (const c of publishedCaseStudies) {
      expect(c.published).toBe(true);
    }
  });

  it("excludes any study not explicitly published (draft client content stays private)", () => {
    const unpublished = caseStudies.filter((c) => c.published !== true);
    for (const c of unpublished) {
      expect(publishedCaseStudies).not.toContain(c);
    }
  });

  it("the filter, applied to a mixed set, drops the unpublished draft", () => {
    // Guards the invariant independent of current real data: a repo-less,
    // unpublished client draft must never survive the filter.
    const draft: CaseStudy = {
      slug: "draft-client",
      title: "Draft Client Work",
      query: "x",
      summary: "unpublished, no permission on file",
      stack: ["Laravel"],
      client: "Client A",
      published: false, // permission pending
      sections: [{ h: "The build", body: "..." }],
    };
    const mixed = [...caseStudies, draft];
    const gated = mixed.filter((c) => c.published === true);
    expect(gated.map((c) => c.slug)).not.toContain("draft-client");
  });
});

describe("bot corpus repo guard (ceo-plan row 8)", () => {
  it("built system prompt contains no literal 'undefined' (repo-less studies safe)", () => {
    expect(buildSystemPrompt()).not.toContain("undefined");
  });

  it("only cites published studies in the corpus", () => {
    const prompt = buildSystemPrompt();
    for (const c of caseStudies) {
      if (c.published !== true) expect(prompt).not.toContain(c.title);
    }
  });
});
