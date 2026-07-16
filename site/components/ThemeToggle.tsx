"use client";

import { useEffect, useState } from "react";

/** Theme toggle — persisted choice wins over prefers-color-scheme (SPEC §4). */
export function ThemeToggle() {
  const [theme, setTheme] = useState<string | null>(null);

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme ?? "dark");
  }, []);

  function toggle() {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {}
    setTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="mono min-h-8 cursor-pointer px-1 text-sm"
      style={{ color: "var(--muted)" }}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      title="Toggle theme"
    >
      {theme === null ? "◐" : theme === "dark" ? "☀" : "☾"}
    </button>
  );
}
