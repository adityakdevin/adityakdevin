import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://adityadev.in";
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/cv`, changeFrequency: "monthly", priority: 0.8 },
  ];
}
