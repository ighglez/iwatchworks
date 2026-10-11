import type { Product } from "@prisma/client";

export type PublicProduct = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  reference: string;
  category: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  lowStockThreshold: number;
  images: string[];
  specs: Record<string, string>;
  artwork: string;
  featured: boolean;
};

export function parseImages(json: string): string[] {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function parseSpecs(json: string): Record<string, string> {
  try {
    const v = JSON.parse(json);
    return v && typeof v === "object" && !Array.isArray(v) ? v : {};
  } catch {
    return {};
  }
}

export function toPublic(p: Product): PublicProduct {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    reference: p.reference,
    category: p.category,
    description: p.description,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    stock: p.stock,
    lowStockThreshold: p.lowStockThreshold,
    images: parseImages(p.images),
    specs: parseSpecs(p.specs),
    artwork: p.artwork,
    featured: p.featured,
  };
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Búsqueda sin tildes ni mayúsculas: cada palabra debe aparecer en marca, modelo, referencia o categoría. */
export function matchesQuery(p: { name: string; brand: string; reference: string; category: string }, q: string) {
  const hay = norm(`${p.brand} ${p.name} ${p.reference} ${p.category}`);
  return norm(q).split(/\s+/).filter(Boolean).slice(0, 6).every((w) => hay.includes(w));
}
