import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/posts";
import { publishedCaseStudies } from "@/content/data/work";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE_URL;
  // Per-study URLs generated from PUBLISHED studies only - never hand-edited,
  // never leaks a draft. See ceo-plan row 9 + D4b.
  const studies = publishedCaseStudies.map((c) => ({
    url: `${base}/work/${c.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));
  // Legacy imports keep their Dev.to canonical - they don't belong in the sitemap.
  const posts = getAllPosts()
    .filter((p) => !p.canonical)
    .map((p) => ({
      url: `${base}/blog/${p.slug}`,
      lastModified: new Date(`${p.date}T00:00:00Z`),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/cv`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/hire`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/now`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/uses`, changeFrequency: "monthly", priority: 0.4 },
    // /work index appears only when it renders (>=2 published studies) - matches
    // the thin-index guard on the page so the sitemap never points at a 404.
    ...(publishedCaseStudies.length >= 2
      ? [{ url: `${base}/work`, changeFrequency: "monthly" as const, priority: 0.6 }]
      : []),
    ...studies,
    { url: `${base}/services/laravel-ai-development`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/services/nodejs-ai-development`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/services/python-ai-development`, changeFrequency: "monthly", priority: 0.9 },
    // /blog is listed when ANY post renders the index - legacy imports keep
    // their own canonical but still populate the page (red-team: gate on
    // content, not on the canonical-filtered subset).
    ...(getAllPosts().length > 0
      ? [{ url: `${base}/blog`, changeFrequency: "weekly" as const, priority: 0.8 }]
      : []),
    ...posts,
  ];
}
