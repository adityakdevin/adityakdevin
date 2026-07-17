import { notFound } from "next/navigation";
import { ogImage, OG_SIZE } from "@/lib/og";
import { getAllPosts, getPost } from "@/lib/posts";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Blog post";

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  // Unknown slugs 404 like the page does — a 200 fallback would make this an
  // unauthenticated CPU-amplification endpoint (satori render per unique URL).
  if (!post) notFound();
  return ogImage({
    command: `cat blog/${slug}.md`,
    title: post.title,
    subtitle: `${post.date} · ${post.tags.join(" · ")}`,
  });
}
