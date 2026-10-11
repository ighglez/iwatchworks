import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { matchesQuery, toPublic } from "@/lib/product";

/** Búsqueda rápida para el buscador de la cabecera. */
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") || "").trim().slice(0, 60);
  if (q.length < 2) return NextResponse.json({ results: [] });
  const rows = (await db.product.findMany({ where: { active: true }, orderBy: [{ featured: "desc" }, { createdAt: "desc" }] }))
    .filter((p) => matchesQuery(p, q))
    .slice(0, 6);
  const results = rows.map(toPublic).map((p) => ({
    slug: p.slug, name: p.name, brand: p.brand, reference: p.reference, price: p.price, image: p.images[0] ?? null, artwork: p.artwork, stock: p.stock,
  }));
  return NextResponse.json({ results }, { headers: { "Cache-Control": "no-store" } });
}
