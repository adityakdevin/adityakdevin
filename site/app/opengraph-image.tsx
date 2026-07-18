import { ogImage, OG_SIZE } from "@/lib/og";
import { profile } from "@/content/data/profile";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = `${profile.name} - Full Stack Developer, AI Engineer & Solution Architect`;

export default function Image() {
  return ogImage({
    command: "whoami",
    title: profile.name,
    subtitle: `${profile.headline} · ${profile.company} · Lucknow, India`,
  });
}
