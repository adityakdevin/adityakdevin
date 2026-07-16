import { ogImage, OG_SIZE } from "@/lib/og";
import { profile } from "@/content/data/profile";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = `CV — ${profile.name}`;

export default function Image() {
  return ogImage({
    command: "cat cv.pdf",
    title: `CV — ${profile.name}`,
    subtitle: `${profile.yearsExperience} yrs · Laravel · Vue/React · AI/LLM integrations`,
  });
}
