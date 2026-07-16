import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://adityadev.in";
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/cv`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/now`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/uses`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/work/budgetgen`, changeFrequency: "monthly", priority: 0.7 },
  ];
}
