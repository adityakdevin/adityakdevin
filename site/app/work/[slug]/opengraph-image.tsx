import { notFound } from "next/navigation";
import { ogImage, OG_SIZE } from "@/lib/og";
import { publishedCaseStudies } from "@/content/data/work";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Case study";

export function generateStaticParams() {
  return publishedCaseStudies.map((c) => ({ slug: c.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const study = publishedCaseStudies.find((c) => c.slug === slug);
  // Unknown/unpublished slugs 404 like the page does - a 200 fallback would make
  // this an unauthenticated CPU-amplification endpoint (satori render per URL).
  if (!study) notFound();
  return ogImage({
    command: `cat work/${slug}.md`,
    title: study.title,
    subtitle: study.stack.join(" · "),
  });
}
