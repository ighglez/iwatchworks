import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { toPublic } from "@/lib/product";
import ProductCard from "@/components/product/ProductCard";

export const metadata: Metadata = { title: "Tienda", description: "Relojes automáticos japoneses: Seiko, GMT, cronógrafos y más." };
export const dynamic = "force-dynamic";

const SORTS: Record<string, { label: string; orderBy: Prisma.ProductOrderByWithRelationInput[] }> = {
  relevancia: { label: "Relevancia", orderBy: [{ featured: "desc" }, { createdAt: "desc" }] },
  "precio-asc": { label: "Precio: menor a mayor", orderBy: [{ price: "asc" }] },
  "precio-desc": { label: "Precio: mayor a menor", orderBy: [{ price: "desc" }] },
  novedades: { label: "Novedades", orderBy: [{ createdAt: "desc" }] },
  nombre: { label: "Nombre A-Z", orderBy: [{ name: "asc" }] },
};

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function Tienda({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const categoria = one("categoria");
  const marca = one("marca");
  const q = one("q")?.slice(0, 60);
  const disponibles = one("disponibles") === "1";
  const orden = SORTS[one("orden") || ""] ? one("orden")! : "relevancia";

  const where: Prisma.ProductWhereInput = {
    active: true,
    ...(categoria ? { category: categoria } : {}),
    ...(marca ? { brand: marca } : {}),
    ...(disponibles ? { stock: { gt: 0 } } : {}),
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { reference: { contains: q, mode: "insensitive" } }, { brand: { contains: q, mode: "insensitive" } }] } : {}),
  };

  const [products, facets] = await Promise.all([
    db.product.findMany({ where, orderBy: SORTS[orden].orderBy }),
    db.product.findMany({ where: { active: true }, select: { category: true, brand: true } }),
  ]);
  const categories = [...new Set(facets.map((f) => f.category))].sort();
  const brands = [...new Set(facets.map((f) => f.brand))].sort();

  const href = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { categoria, marca, q, orden: orden === "relevancia" ? undefined : orden, disponibles: disponibles ? "1" : undefined, ...patch };
    Object.entries(merged).forEach(([k, v]) => v && p.set(k, v));
    const s = p.toString();
    return s ? `/tienda?${s}` : "/tienda";
  };

  const chip = (active: boolean) =>
    `border px-4 py-2 text-xs uppercase tracking-widest transition ${active ? "border-ink bg-ink text-ivory" : "border-line bg-white text-ink-soft hover:border-ink"}`;

  return (
    <div className="container-x py-12 md:py-16">
      <header className="mb-10 text-center">
        <p className="eyebrow">Tienda</p>
        <h1 className="mt-3 text-5xl md:text-6xl">Nuestra colección</h1>
        <p className="mx-auto mt-4 max-w-xl text-ink-soft">Explora nuestra selección exclusiva de relojes automáticos japoneses.</p>
      </header>

      <div className="mb-8 flex flex-col gap-4 border-y border-line py-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <Link href={href({ categoria: undefined })} className={chip(!categoria)}>Todos</Link>
          {categories.map((c) => (
            <Link key={c} href={href({ categoria: c })} className={chip(categoria === c)}>{c}</Link>
          ))}
          {brands.length > 1 && brands.map((b) => (
            <Link key={b} href={href({ marca: marca === b ? undefined : b })} className={chip(marca === b)}>{b}</Link>
          ))}
          <Link href={href({ disponibles: disponibles ? undefined : "1" })} className={chip(disponibles)}>Solo disponibles</Link>
        </div>
        <form className="flex gap-2" action="/tienda">
          {categoria && <input type="hidden" name="categoria" value={categoria} />}
          {marca && <input type="hidden" name="marca" value={marca} />}
          {disponibles && <input type="hidden" name="disponibles" value="1" />}
          <input name="q" defaultValue={q} placeholder="Buscar modelo o referencia" className="input w-full py-2 lg:w-56" aria-label="Buscar" />
          <select name="orden" defaultValue={orden} className="input w-auto py-2" aria-label="Ordenar">
            {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <button className="btn-primary px-4 py-2">Aplicar</button>
        </form>
      </div>

      <p className="mb-6 text-sm text-ink-muted">{products.length} {products.length === 1 ? "reloj" : "relojes"}</p>
      {products.length ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => <ProductCard key={p.id} product={toPublic(p)} />)}
        </div>
      ) : (
        <div className="py-20 text-center">
          <p className="font-serif text-2xl">No hay relojes con estos filtros</p>
          <Link href="/tienda" className="btn-outline mt-6">Ver toda la colección</Link>
        </div>
      )}
    </div>
  );
}
