import Link from "next/link";

/**
 * Cross-links the three per-stack AI service pages (Laravel / Node / Python).
 * Lets a visitor on the wrong stack find the right page, and signals the cluster
 * to search engines. The current page renders as plain accented text, not a link.
 */
const STACKS = [
  { key: "laravel", label: "Laravel", href: "/services/laravel-ai-development" },
  { key: "node", label: "Node.js", href: "/services/nodejs-ai-development" },
  { key: "python", label: "Python", href: "/services/python-ai-development" },
] as const;

export function ServiceStackNav({ current }: { current: "laravel" | "node" | "python" }) {
  return (
    <p className="mono mb-8 text-sm" style={{ color: "var(--muted)" }}>
      AI integration for:{" "}
      {STACKS.map((s, i) => (
        <span key={s.key}>
          {i > 0 && <span style={{ color: "var(--border)" }}> · </span>}
          {s.key === current ? (
            <span style={{ color: "var(--accent)" }}>{s.label}</span>
          ) : (
            <Link href={s.href}>{s.label}</Link>
          )}
        </span>
      ))}
    </p>
  );
}
