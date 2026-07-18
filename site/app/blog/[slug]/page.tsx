import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllPosts, getPost, canonicalUrl } from "@/lib/posts";
import { articleJsonLd, jsonLdScript } from "@/lib/jsonld";
import { profile } from "@/content/data/profile";
import { withRef } from "@/lib/site";
import { NewsletterForm } from "@/components/NewsletterForm";

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    // Self-canonical unless a legacy import points back at Dev.to.
    alternates: { canonical: canonicalUrl(post) },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <main className="mx-auto max-w-3xl flex-1 px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(articleJsonLd(post)) }}
      />
      {/* break-all: the slug is one unbreakable mono token - without it, long
          slugs force horizontal page scroll on phones. */}
      <p className="mono mb-3 break-all text-sm" style={{ color: "var(--muted)" }}>
        <span style={{ color: "var(--accent)" }}>$</span> cat blog/{post.slug}.md
      </p>
      <h1 className="mono h2-rule text-3xl font-semibold leading-tight md:text-4xl">
        {post.title}
      </h1>
      <p className="mono mt-4 text-sm" style={{ color: "var(--muted)" }}>
        {post.date} · {post.tags.join(" · ")}
      </p>

      <article className="prose-post mt-10">
        <MDXRemote
          source={post.content}
          components={{
            // Walkthroughs are screenshot-heavy - below-fold images load lazily.
            // Plain <img>: MDX images have unknown dimensions (next/image needs
            // width/height) and alt text arrives via {...props} from the markdown.
            // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
            img: (props) => <img loading="lazy" decoding="async" {...props} />,
          }}
        />
      </article>

      <div className="mt-12 flex flex-wrap gap-4">
        <a
          href={withRef(profile.bookingUrl, `blog-${post.slug}`)}
          className="btn mono min-h-11 rounded px-5 py-2.5 text-sm font-semibold no-underline"
          style={{ background: "var(--accent)", color: "var(--on-accent)" }}
        >
          Book a call →
        </a>
        <Link
          href="/#contact"
          className="btn mono min-h-11 rounded border px-5 py-2.5 text-sm font-medium no-underline"
          style={{ borderColor: "var(--border)" }}
        >
          Build something like this →
        </Link>
      </div>

      <div className="mt-12">
        <NewsletterForm />
      </div>
    </main>
  );
}
