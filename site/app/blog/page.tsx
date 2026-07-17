import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts, BLOG_DESCRIPTION } from "@/lib/posts";
import { profile } from "@/content/data/profile";
import { NewsletterForm } from "@/components/NewsletterForm";

export const metadata: Metadata = {
  title: "Blog — field notes from Laravel + AI work",
  description: `${BLOG_DESCRIPTION} By Aditya Kumar.`,
  alternates: { canonical: "/blog" },
};

/**
 * Plain dated list at launch (eng review: tag FILTERS deferred until the
 * corpus passes ~10 posts — tags live in frontmatter from day one).
 */
export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <main className="mx-auto max-w-3xl flex-1 px-6 py-16">
      <p className="mono mb-3 text-sm" style={{ color: "var(--muted)" }}>
        <span style={{ color: "var(--accent)" }}>$</span> ls blog/
      </p>
      <h1 className="mono h2-rule text-4xl font-semibold leading-tight">Field notes</h1>
      <p className="mt-4 text-lg" style={{ color: "var(--muted)" }}>
        {BLOG_DESCRIPTION}
      </p>

      {posts.length === 0 ? (
        <p className="mono mt-12 text-sm" style={{ color: "var(--muted)" }}>
          ls: blog/: first posts landing soon —{" "}
          <a href={profile.devto}>read the series on dev.to →</a>
        </p>
      ) : (
        <ul className="mt-12 space-y-8">
          {posts.map((post) => (
            <li key={post.slug}>
              <p className="mono text-sm" style={{ color: "var(--muted)" }}>
                {post.date}
              </p>
              <Link
                href={`/blog/${post.slug}`}
                className="mono mt-1 block text-xl font-semibold no-underline"
              >
                {post.title}
              </Link>
              <p className="mt-2" style={{ color: "var(--muted)" }}>
                {post.description}
              </p>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-16">
        <NewsletterForm />
      </div>
    </main>
  );
}
