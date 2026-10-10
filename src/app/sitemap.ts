import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { SITE } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await db.product.findMany({ where: { active: true }, select: { slug: true, updatedAt: true } });
  return [
    { url: SITE.url, priority: 1 },
    { url: `${SITE.url}/tienda`, priority: 0.9 },
    ...products.map((p) => ({ url: `${SITE.url}/producto/${p.slug}`, lastModified: p.updatedAt, priority: 0.8 })),
    ...["condiciones", "envios-devoluciones", "privacidad"].map((s) => ({ url: `${SITE.url}/legal/${s}`, priority: 0.3 })),
  ];
}
