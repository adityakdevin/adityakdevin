import type { Metadata } from "next";
import { profile } from "@/content/data/profile";

export const metadata: Metadata = {
  title: "Uses",
  description: `The tools ${profile.name} uses daily: PhpStorm, Claude Code, Laravel toolchain, Docker, and the stack behind 7+ years of shipped products.`,
  alternates: { canonical: "/uses" },
};

const groups: { h: string; items: { name: string; note: string }[] }[] = [
  {
    h: "Editor & terminal",
    items: [
      { name: "PhpStorm", note: "primary IDE — the Laravel/PHP tooling is unmatched" },
      { name: "Claude Code", note: "AI pair programmer in the terminal; a genuine multiplier, not autocomplete" },
      { name: "zsh on macOS", note: "with the usual git-heavy workflow, gh CLI for everything GitHub" },
    ],
  },
  {
    h: "Backend",
    items: [
      { name: "Laravel + PHP", note: "the workhorse — 7+ years of production systems" },
      { name: "Python", note: "AI/data work: embeddings, pipelines, scripts" },
      { name: "Node.js", note: "tooling and the odd service where JS fits better" },
      { name: "MySQL / PostgreSQL / Redis", note: "data layer; Redis for queues, cache, and rate limiting" },
    ],
  },
  {
    h: "Frontend",
    items: [
      { name: "Vue / Nuxt", note: "first choice for client SPAs" },
      { name: "React / Next.js", note: "this site runs on it; TypeScript everywhere" },
      { name: "Tailwind CSS", note: "utility CSS with a real token system on top" },
    ],
  },
  {
    h: "AI",
    items: [
      { name: "Claude API", note: "production LLM features and this site's upcoming assistant" },
      { name: "OpenAI API", note: "chat integrations from the article series and client work" },
    ],
  },
  {
    h: "Infra & delivery",
    items: [
      { name: "Docker", note: "dev parity and deployment" },
      { name: "AWS", note: "S3, EC2, the usual suspects for client hosting" },
      { name: "GitHub Actions", note: "CI/CD — this repo alone runs four workflows" },
      { name: "Vercel", note: "this site's home" },
    ],
  },
];

export default function UsesPage() {
  return (
    <main className="mx-auto max-w-3xl flex-1 px-6 py-16">
      <p className="mono mb-3 text-sm" style={{ color: "var(--muted)" }}>
        <span style={{ color: "var(--accent)" }}>$</span> which --all everything
      </p>
      <h1 className="mono text-4xl font-semibold">Uses</h1>
      <p className="mt-3" style={{ color: "var(--muted)" }}>
        The tools behind the work. No affiliate links, no gear-acquisition syndrome — just what
        actually ships software.
      </p>

      {groups.map((g) => (
        <section key={g.h} className="mt-10">
          <h2 className="mono border-b pb-2 text-xl font-semibold" style={{ borderColor: "var(--border)" }}>
            {g.h}
          </h2>
          <ul className="mt-4 space-y-3">
            {g.items.map((item) => (
              <li key={item.name}>
                <span className="mono font-medium">{item.name}</span>{" "}
                <span style={{ color: "var(--muted)" }}>— {item.note}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
