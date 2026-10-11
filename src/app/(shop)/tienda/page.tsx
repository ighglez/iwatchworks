import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { toPublic } from "@/lib/product";
import ProductCard from "@/components/product/ProductCard";

export const metadata: Metadata = { title: "Colección", description: "Relojes automáticos japoneses seleccionados: GMT, cronógrafos y más. Envío asegurado gratuito." };
export const dynamic = "force-dynamic";

const SORTS: Record<string, { label: string; orderBy: Prisma.ProductOrderByWithRelationInput[] }> = {
  relevancia: { label: "Relevancia", orderBy: [{ featured: "desc" }, { createdAt: "desc" }] },
  "precio-asc": { label: "Precio ascendente", orderBy: [{ price: "asc" }] },
  "precio-desc": { label: "Precio descendente", orderBy: [{ price: "desc" }] },
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
    `whitespace-nowrap rounded-full px-5 py-2.5 text-sm transition ${active ? "bg-gold text-white" : "bg-stone text-ink-soft hover:bg-ivory-dark hover:text-ink"}`;

  const title = categoria === "Cronógrafo" ? "Cronógrafos" : categoria ?? "La colección";

  return (
    <div className="container-x pb-24 pt-12 md:pt-20">
      <header className="max-w-2xl">
        <p className="eyebrow">Colección</p>
        <h1 className="mt-4 text-5xl md:text-7xl">{title}</h1>
        <p className="lead mt-5">Relojes automáticos y de alta precisión, seleccionados uno a uno. Todos nuevos, originales y con envío asegurado.</p>
      </header>

      <div className="sticky top-16 z-20 -mx-5 mt-12 border-b border-line bg-ivory/90 px-5 py-4 backdrop-blur-xl sm:-mx-8 sm:px-8 md:top-[76px] lg:-mx-12 lg:px-12">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:pb-0">
            <Link href={href({ categoria: undefined })} className={chip(!categoria)}>Todos</Link>
            {categories.map((c) => (
              <Link key={c} href={href({ categoria: c })} className={chip(categoria === c)}>{c}</Link>
            ))}
            {brands.length > 1 && brands.map((b) => (
              <Link key={b} href={href({ marca: marca === b ? undefined : b })} className={chip(marca === b)}>{b}</Link>
            ))}
            <Link href={href({ disponibles: disponibles ? undefined : "1" })} className={chip(disponibles)}>Disponibles</Link>
          </div>
          <form className="flex gap-2" action="/tienda">
            {categoria && <input type="hidden" name="categoria" value={categoria} />}
            {marca && <input type="hidden" name="marca" value={marca} />}
            {disponibles && <input type="hidden" name="disponibles" value="1" />}
            <input name="q" defaultValue={q} placeholder="Buscar modelo o referencia" className="input rounded-full py-2.5 lg:w-60" aria-label="Buscar" />
            <select name="orden" defaultValue={orden} className="input w-auto rounded-full py-2.5" aria-label="Ordenar">
              {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <button className="btn-primary px-5 py-2.5">Aplicar</button>
          </form>
        </div>
      </div>

      <p className="mb-8 mt-8 text-sm text-ink-muted">{products.length} {products.length === 1 ? "reloj" : "relojes"}</p>
      {products.length ? (
        <div className="grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p, i) => <ProductCard key={p.id} product={toPublic(p)} priority={i < 3} />)}
        </div>
      ) : (
        <div className="rounded-3xl bg-stone py-24 text-center">
          <p className="text-2xl font-semibold">No hay relojes con estos filtros</p>
          <Link href="/tienda" className="btn-outline mt-8">Ver toda la colección</Link>
        </div>
      )}
    </div>
  );
}
