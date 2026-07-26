import { ogImage, OG_SIZE } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "AI Integration Audit";

// Static segment, so it needs its own card - the [slug] image route does not
// cover it (Next resolves the static path first, as it does for the page).
export default function Image() {
  return ogImage({
    command: "cat services/ai-integration-audit.md",
    title: "AI Integration Audit: one week, fixed price",
    subtitle: "Build-ready spec, cost and risk spelled out · adityadev.in",
  });
}
