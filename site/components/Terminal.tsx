"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { profile } from "@/content/data/profile";
import { withRef } from "@/lib/site";

type Line = { kind: "cmd" | "out" | "accent"; text: string; cursor?: boolean };

const BOOT: Line[] = [
  { kind: "accent", text: "AskAditya v1.0 — type 'help' or just ask." },
];

const SUGGESTIONS = [
  "what does an AI chatbot cost?",
  "can he take over my codebase?",
  "what's his stack?",
] as const;

/**
 * The widget (SPEC §6) — offline commands always work; free text streams from
 * /api/chat. When the route is dormant (no API key) or degraded (rate/budget
 * caps), free text falls back to a friendly notice — never a frozen cursor.
 * Motion #3: open/close 250ms ease-in-out. Full-screen on mobile.
 */
export function Terminal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<Line[]>(BOOT);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const busy = useRef(false);

  const wasOpen = useRef(false);
  useEffect(() => {
    if (open) inputRef.current?.focus();
    else if (wasOpen.current) launcherRef.current?.focus(); // return focus on close, never on mount
    wasOpen.current = open;
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lines]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      // Focus trap: aria-modal promises Tab stays inside the dialog
      if (e.key === "Tab" && panelRef.current && !panelRef.current.classList.contains("invisible")) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>("button, input");
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function print(...next: Line[]) {
    setLines((prev) => [...prev, ...next]);
  }

  // The stream owns ONE line by index — other prints stay safe while it runs.
  const streamIdx = useRef(-1);

  function replaceStreamLine(line: Line) {
    setLines((prev) => prev.map((l, i) => (i === streamIdx.current ? line : l)));
  }

  async function ask(message: string) {
    busy.current = true;
    setLines((prev) => {
      streamIdx.current = prev.length;
      return [...prev, { kind: "out", text: "", cursor: true }]; // blinking cursor = thinking
    });
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { reason?: string };
        replaceStreamLine({
          kind: "accent",
          text:
            data.reason === "budget"
              ? "AI is resting (budget cap) — commands still work. try 'help'."
              : data.reason === "rate"
                ? "rate limit: 10 questions/hour — commands still work meanwhile."
                : res.status === 422
                  ? "keep it under 300 characters — try a shorter question."
                  : "AI mode is being wired up — soon I'll answer that. For now, try 'help'.",
        });
        return;
      }
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        replaceStreamLine({ kind: "out", text: acc, cursor: true });
      }
      if (!acc.trim()) {
        replaceStreamLine({ kind: "accent", text: "no answer came back — ask again, or try 'help'." });
      } else {
        replaceStreamLine({ kind: "out", text: acc }); // done — cursor off
      }
    } catch {
      replaceStreamLine({ kind: "accent", text: "connection dropped — ask again, or try 'help'." });
    } finally {
      busy.current = false;
    }
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
          { kind: "accent", text: "or just type a question — the AI answers from this site." },
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
        setTimeout(() => window.open(withRef(profile.bookingUrl, "terminal"), "_blank", "noopener"), 500);
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
          { kind: "out", text: "AI mode: Claude Haiku + a prompt-cached corpus of this site's content —" },
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
        if (busy.current) {
          print({ kind: "accent", text: "still answering — one question at a time." });
        } else {
          void ask(cmd);
        }
    }
  }

  return (
    <div data-no-print>
      {/* Floating launcher */}
      <button
        ref={launcherRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open AskAditya terminal"
        className={`mono fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-50 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border text-lg font-semibold shadow-lg transition-opacity duration-250 md:bottom-6 md:right-6 ${open ? "pointer-events-none opacity-0" : "opacity-100"}`}
        style={{ background: "var(--surface)", borderColor: "var(--accent)", color: "var(--accent)" }}
      >
        {">_"}
      </button>

      {/* Panel — full-screen on mobile */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="AskAditya terminal"
        aria-hidden={!open}
        className={`fixed z-50 flex flex-col overflow-hidden border shadow-2xl transition-all duration-250 ease-in-out ${
          open ? "visible pointer-events-auto opacity-100" : "invisible pointer-events-none opacity-0"
        } inset-0 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] md:inset-auto md:bottom-6 md:right-6 md:h-[560px] md:w-[460px] md:rounded-lg md:pt-0 md:pb-0`}
        style={{ background: "var(--dark-bg)", borderColor: "var(--dark-border)" }}
      >
        <div
          className="mono flex items-center justify-between border-b px-4 py-2.5 text-xs"
          style={{ borderColor: "var(--dark-border)", color: "var(--dark-muted)" }}
        >
          <span>
            <span style={{ color: "var(--dark-accent)" }}>aditya@dev</span>:~/ask
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close terminal"
            className="mono flex min-h-11 min-w-11 cursor-pointer items-center justify-center text-base"
            style={{ color: "var(--dark-muted)" }}
          >
            ✕
          </button>
        </div>

        <div ref={scrollRef} className="mono flex-1 space-y-1.5 overflow-y-auto p-4 text-sm">
          {lines.map((line, i) => (
            <p
              key={i}
              className="whitespace-pre-wrap"
              style={{
                color: line.kind === "accent" ? "var(--dark-accent)" : line.kind === "cmd" ? "var(--dark-text)" : "var(--dark-muted)",
              }}
            >
              {line.kind === "cmd" ? <span style={{ color: "var(--dark-accent)" }}>$ </span> : null}
              {line.text}
              {line.cursor ? <span className="cursor" aria-hidden /> : null}
            </p>
          ))}
        </div>

        {/* First-run affordance: what CAN I ask? Chips vanish after the first input, return on 'clear'. */}
        {lines.length === 1 && (
          <div className="flex flex-wrap gap-2 px-4 pb-3">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => run(s)}
                className="term-chip mono cursor-pointer rounded-full border px-3 py-1.5 text-xs"
                style={{ borderColor: "var(--dark-border)", color: "var(--dark-muted)" }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(input);
            setInput("");
          }}
          className="flex items-center gap-2 border-t px-4 py-3"
          style={{ borderColor: "var(--dark-border)" }}
        >
          <span className="mono text-sm" style={{ color: "var(--dark-accent)" }}>
            $
          </span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label="Terminal command input"
            autoComplete="off"
            spellCheck={false}
            maxLength={300}
            className="mono min-h-11 flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--dark-text)" }}
            placeholder="ask anything — or 'help'"
          />
          <button
            type="submit"
            aria-label="Send"
            disabled={!input.trim()}
            className="mono flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded border text-base transition-opacity disabled:cursor-default disabled:opacity-40"
            style={{ borderColor: "var(--dark-border)", color: "var(--dark-accent)" }}
          >
            ↵
          </button>
        </form>
      </div>
    </div>
  );
}
