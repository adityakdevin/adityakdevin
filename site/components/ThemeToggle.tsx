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

const iconProps = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

function SunIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg {...iconProps}>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  );
}

export function ThemeToggle({ variant = "chip" }: { variant?: "chip" | "tab" }) {
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

  if (variant === "tab") {
    return (
      <button
        type="button"
        onClick={toggle}
        className="mono flex min-h-16 w-full cursor-pointer flex-col items-center justify-center gap-1"
        style={{ color: "var(--muted)" }}
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      >
        {theme === "light" ? <MoonIcon /> : <SunIcon />}
        <span className="text-[10px]">theme</span>
      </button>
    );
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
