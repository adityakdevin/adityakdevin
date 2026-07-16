import type { Metadata } from "next";
import { profile } from "@/content/data/profile";

/**
 * /now (SPEC §5): current focus. RULE: carries a visible "last updated" stamp,
 * and gets CUT from the site if stale >2 months — update LAST_UPDATED with every edit.
 */
const LAST_UPDATED = "2026-07-16";

export const metadata: Metadata = {
  title: "Now",
  description: `What ${profile.name} is focused on right now: AI/LLM integrations in Laravel, the Laravel+AI article series, and Tech Lead work at ${profile.company}.`,
  alternates: { canonical: "/now" },
};

export default function NowPage() {
  return (
    <main className="mx-auto max-w-3xl flex-1 px-6 py-16">
      <p className="mono mb-3 text-sm" style={{ color: "var(--muted)" }}>
        <span style={{ color: "var(--accent)" }}>$</span> date && cat now.md
      </p>
      <h1 className="mono h2-rule text-4xl font-semibold">What I&apos;m doing now</h1>
      <p className="mono mt-3 text-sm" style={{ color: "var(--muted)" }}>
        last updated: {LAST_UPDATED} · inspired by{" "}
        <a href="https://nownownow.com/about">nownownow.com</a>
      </p>

      <section className="mt-10 space-y-8">
        <div>
          <h2 className="mono text-xl font-semibold">Shipping AI into client products</h2>
          <p className="mt-2">
            Day job as {profile.role} at {profile.company}: leading delivery of client web
            products, with a growing share of the work being LLM features — chatbots, document
            automation, and AI-assisted workflows wired into existing Laravel systems.
          </p>
        </div>
        <div>
          <h2 className="mono text-xl font-semibold">Writing the Laravel + AI series</h2>
          <p className="mt-2">
            Publishing a hands-on series on <a href={profile.devto}>Dev.to</a> — chatbots,
            streaming responses with SSE, and next up: RAG with pgvector. New article roughly
            every two weeks.
          </p>
        </div>
        <div>
          <h2 className="mono text-xl font-semibold">Rebuilding this site</h2>
          <p className="mt-2">
            You&apos;re looking at it — a ground-up rebuild in Next.js with an AI-era focus. The
            terminal assistant in the corner is part of the same project; its AI mode ships next.
          </p>
        </div>
        <div>
          <h2 className="mono text-xl font-semibold">Learning in public</h2>
          <p className="mt-2">
            Deepening Python and applied AI engineering: embeddings, retrieval pipelines, and
            evaluation — the parts of LLM work that separate demos from products.
          </p>
        </div>
      </section>
    </main>
  );
}
