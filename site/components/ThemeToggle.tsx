"use client";

import { useSyncExternalStore } from "react";

/** Theme toggle — persisted choice wins over prefers-color-scheme (SPEC §4). */

// External store = <html data-theme> — keeps every mounted toggle (desktop
// header + mobile tab bar) in sync without duplicated state.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(
    subscribe,
    () => document.documentElement.dataset.theme ?? "dark",
    () => null, // SSR: theme unknown until the boot script runs
  );

  function toggle() {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next; // MutationObserver re-renders all toggles
    try {
      localStorage.setItem("theme", next);
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="mono flex min-h-11 min-w-11 cursor-pointer items-center justify-center text-sm"
      style={{ color: "var(--muted)" }}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      title="Toggle theme"
    >
      {theme === null ? "◐" : theme === "dark" ? "☀" : "☾"}
    </button>
  );
}
