import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { matchesQuery, toPublic } from "@/lib/product";

// Límite sencillo por IP y por instancia para frenar abusos del buscador.
const hits = new Map<string, { n: number; reset: number }>();
function allowed(ip: string) {
  const now = Date.now();
  if (hits.size > 5000) hits.clear();
  const h = hits.get(ip);
  if (!h || h.reset < now) { hits.set(ip, { n: 1, reset: now + 60_000 }); return true; }
  return ++h.n <= 90;
}

/** Búsqueda rápida para el buscador de la cabecera. */
export async function GET(req: NextRequest) {
  const ip = (req.headers.get("x-forwarded-for")?.split(",")[0] || "local").trim();
  if (!allowed(ip)) return NextResponse.json({ results: [] }, { status: 429 });
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
