"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { profile } from "@/content/data/profile";

type Line = { kind: "cmd" | "out" | "accent"; text: string };

const BOOT: Line[] = [
  { kind: "accent", text: "AskAditya v1.0 — type 'help' or just ask." },
];

/**
 * The widget (SPEC §6) — offline commands ship now; free text gets the
 * "AI mode coming soon" notice until /api/chat lands in P3.
 * Motion #3: open/close 250ms ease-in-out. Full-screen on mobile.
 */
export function Terminal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<Line[]>(BOOT);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lines]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function print(...next: Line[]) {
    setLines((prev) => [...prev, ...next]);
  }

  function run(raw: string) {
    const cmd = raw.trim();
    if (!cmd) return;
    print({ kind: "cmd", text: cmd });

    switch (cmd.toLowerCase()) {
      case "help":
        print(
          { kind: "out", text: "available commands:" },
          { kind: "out", text: "  whoami     who is this guy" },
          { kind: "out", text: "  skills     tech stack" },
          { kind: "out", text: "  work       featured projects" },
          { kind: "out", text: "  cv         open the CV page" },
          { kind: "out", text: "  book       book a call" },
          { kind: "out", text: "  contact    ways to reach me" },
          { kind: "out", text: "  source     how this terminal works" },
          { kind: "out", text: "  clear      clear the screen" },
          { kind: "accent", text: "or type a question — AI mode ships soon." },
        );
        break;
      case "whoami":
        print(
          { kind: "out", text: `${profile.name} (${profile.handle})` },
          { kind: "out", text: profile.headline },
          { kind: "out", text: `${profile.role} @ ${profile.company} · ${profile.yearsExperience} yrs · ${profile.location}` },
        );
        break;
      case "skills":
        for (const [group, items] of Object.entries(profile.skills)) {
          print({ kind: "out", text: `${group}: ${items.join(", ")}` });
        }
        break;
      case "work":
        print(
          { kind: "out", text: `→ ${profile.featuredWork.lead.title}` },
          ...profile.featuredWork.links.map((l) => ({ kind: "out" as const, text: `→ ${l.title}` })),
          { kind: "accent", text: "opening /work/budgetgen…" },
        );
        setTimeout(() => {
          setOpen(false);
          router.push("/work/budgetgen");
        }, 600);
        break;
      case "cv":
        print({ kind: "accent", text: "opening /cv…" });
        setTimeout(() => {
          setOpen(false);
          router.push("/cv");
        }, 400);
        break;
      case "book":
      case "sudo hire-aditya":
        print({
          kind: "accent",
          text: cmd.startsWith("sudo")
            ? "[sudo] permission granted. opening calendar…"
            : "opening calendar…",
        });
        setTimeout(() => window.open(profile.bookingUrl, "_blank", "noopener"), 500);
        break;
      case "contact":
        print(
          { kind: "out", text: `email:    ${profile.email}` },
          { kind: "out", text: `github:   ${profile.github}` },
          { kind: "out", text: `linkedin: ${profile.linkedin}` },
        );
        break;
      case "source":
        print(
          { kind: "out", text: "offline commands: plain TypeScript, zero API calls." },
          { kind: "out", text: "AI mode (soon): Claude + a prompt-cached corpus of this site's content —" },
          { kind: "out", text: "the architecture from my Laravel+AI article series:" },
          { kind: "accent", text: profile.devto },
        );
        break;
      case "clear":
        setLines(BOOT);
        break;
      case "exit":
        setOpen(false);
        break;
      default:
        print({
          kind: "accent",
          text: "AI mode is being wired up — soon I'll answer that. For now, try 'help'.",
        });
    }
  }

  return (
    <div data-no-print>
      {/* Floating launcher */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open AskAditya terminal"
        className={`mono fixed bottom-16 right-4 z-50 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border text-lg font-semibold shadow-lg transition-opacity duration-250 md:bottom-6 md:right-6 ${open ? "pointer-events-none opacity-0" : "opacity-100"}`}
        style={{ background: "var(--surface)", borderColor: "var(--accent)", color: "var(--accent)" }}
      >
        {">_"}
      </button>

      {/* Panel — full-screen on mobile */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="AskAditya terminal"
        aria-hidden={!open}
        className={`fixed z-50 flex flex-col overflow-hidden border shadow-2xl transition-all duration-250 ease-in-out ${
          open ? "visible pointer-events-auto opacity-100" : "invisible pointer-events-none opacity-0"
        } inset-0 md:inset-auto md:bottom-6 md:right-6 md:h-[480px] md:w-[420px] md:rounded-lg`}
        style={{ background: "#0d1117", borderColor: "var(--border)" }}
      >
        <div
          className="mono flex items-center justify-between border-b px-4 py-2.5 text-xs"
          style={{ borderColor: "#30363d", color: "#8b949e" }}
        >
          <span>
            <span style={{ color: "#22b8d4" }}>aditya@dev</span>:~/ask
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close terminal"
            className="mono flex min-h-11 min-w-11 cursor-pointer items-center justify-center text-base"
            style={{ color: "#8b949e" }}
          >
            ✕
          </button>
        </div>

        <div ref={scrollRef} className="mono flex-1 space-y-1.5 overflow-y-auto p-4 text-sm">
          {lines.map((line, i) => (
            <p
              key={i}
              style={{
                color: line.kind === "accent" ? "#22b8d4" : line.kind === "cmd" ? "#e6edf3" : "#8b949e",
              }}
            >
              {line.kind === "cmd" ? <span style={{ color: "#22b8d4" }}>$ </span> : null}
              {line.text}
            </p>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(input);
            setInput("");
          }}
          className="flex items-center gap-2 border-t px-4 py-3"
          style={{ borderColor: "#30363d" }}
        >
          <span className="mono text-sm" style={{ color: "#22b8d4" }}>
            $
          </span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label="Terminal command input"
            autoComplete="off"
            spellCheck={false}
            className="mono min-h-11 flex-1 bg-transparent text-sm outline-none"
            style={{ color: "#e6edf3" }}
            placeholder="help"
          />
        </form>
      </div>
    </div>
  );
}
