import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const OG_SIZE = { width: 1200, height: 630 };

/**
 * OG template (SPEC §7 / design review 10A): 1200×630, dark bg, prompt eyebrow,
 * title in Plex Mono 600, muted role line, cyan accent bar, 64px safe area.
 */
export async function ogImage(opts: { command: string; title: string; subtitle: string }) {
  const [regular, semibold] = await Promise.all([
    readFile(path.join(process.cwd(), "assets/fonts/IBMPlexMono-Regular.ttf")),
    readFile(path.join(process.cwd(), "assets/fonts/IBMPlexMono-SemiBold.ttf")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 64,
          backgroundColor: "#0d1117",
          fontFamily: "Plex",
        }}
      >
        <div style={{ display: "flex", fontSize: 28, color: "#8b949e" }}>
          <span style={{ color: "#22b8d4" }}>aditya@dev</span>
          <span>:~$ {opts.command}</span>
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontSize: 76,
            fontWeight: 600,
            color: "#e6edf3",
            lineHeight: 1.1,
          }}
        >
          {opts.title}
        </div>
        <div style={{ display: "flex", marginTop: 24, fontSize: 32, color: "#8b949e" }}>
          {opts.subtitle}
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: 1200,
            height: 8,
            background: "linear-gradient(90deg, #22b8d4, rgba(34,184,212,0))",
          }}
        />
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Plex", data: regular, weight: 400 as const, style: "normal" as const },
        { name: "Plex", data: semibold, weight: 600 as const, style: "normal" as const },
      ],
    },
  );
}
