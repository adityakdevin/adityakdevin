import { notFound } from "next/navigation";
import { ogImage, OG_SIZE } from "@/lib/og";
import { services, getService } from "@/content/data/services";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "AI integration service";

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = getService(slug);
  // 404 on unknown slugs, same as the page and the case-study card: a 200
  // fallback makes this an unauthenticated CPU-amplification endpoint.
  if (!service) notFound();
  return ogImage({
    command: `cat services/${service.file}`,
    title: service.h1,
    subtitle: "Fixed-scope AI Integration Audit · adityadev.in",
  });
}
