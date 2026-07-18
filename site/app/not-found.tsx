import Link from "next/link";

/** 404 (SPEC S5): terminal joke + ls of real pages. */
export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-3xl flex-1 flex-col justify-center px-6 py-24">
      <div
        className="mono rounded-lg border p-8"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <p style={{ color: "var(--muted)" }}>
          <span style={{ color: "var(--accent)" }}>aditya@dev</span>:~$ open {"<that-page>"}
        </p>
        <p className="mt-3 text-xl font-semibold">
          zsh: command not found - <span style={{ color: "var(--accent)" }}>404</span>
        </p>
        <p className="mt-6" style={{ color: "var(--muted)" }}>
          <span style={{ color: "var(--accent)" }}>$</span> ls ~/pages
        </p>
        <ul className="mt-3 space-y-2">
          <li>
            <Link href="/">./home</Link>
          </li>
          <li>
            <Link href="/cv">./cv</Link>
          </li>
          <li>
            <Link href="/#work">./work</Link>
          </li>
          <li>
            <Link href="/#contact">./contact</Link>
          </li>
        </ul>
      </div>
    </main>
  );
}
