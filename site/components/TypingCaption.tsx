"use client";

import { useEffect, useRef, useState } from "react";

/**
 * GitHub-README-style typing banner (native, no external SVG service).
 * SSR renders phrases[0] in full — animation is a post-hydration enhancement;
 * prefers-reduced-motion keeps the static text.
 */
export function TypingCaption({ phrases }: { phrases: readonly string[] }) {
  const [text, setText] = useState(phrases[0]);
  const [animate, setAnimate] = useState(false);
  const state = useRef({ phrase: 0, char: phrases[0].length, deleting: true });

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // async so the effect body itself never sets state (react-hooks/set-state-in-effect)
    const raf = requestAnimationFrame(() => setAnimate(true));
    let timer: ReturnType<typeof setTimeout>;
    // start by holding the SSR'd phrase, then delete → type next → hold → …
    const tick = (delay: number) => {
      timer = setTimeout(() => {
        const s = state.current;
        const current = phrases[s.phrase];
        if (s.deleting) {
          s.char -= 1;
          setText(current.slice(0, s.char));
          if (s.char === 0) {
            s.deleting = false;
            s.phrase = (s.phrase + 1) % phrases.length;
          }
          tick(30);
        } else {
          s.char += 1;
          setText(phrases[s.phrase].slice(0, s.char));
          if (s.char >= phrases[s.phrase].length) {
            s.deleting = true;
            tick(2200); // hold the full phrase
          } else {
            tick(55);
          }
        }
      }, delay);
    };
    tick(2200);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [phrases]);

  return (
    <span className={animate ? "cursor" : undefined}>
      {text}
      {/* keep line height stable when empty mid-delete */}
      {text === "" ? "​" : null}
    </span>
  );
}
