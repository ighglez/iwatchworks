import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { parseImages, parseSpecs } from "@/lib/product";
import ProductForm from "../ProductForm";

export const metadata = { title: "Editar producto" };

const toEuro = (c: number) => (c / 100).toFixed(2).replace(".", ",");

export default async function Editar({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ creado?: string }> }) {
  const { id } = await params;
  const { creado } = await searchParams;
  const [p, cats] = await Promise.all([
    db.product.findUnique({ where: { id } }),
    db.product.findMany({ select: { category: true }, distinct: ["category"] }),
  ]);
  if (!p) notFound();
  return (
    <>
      <Link href="/admin/productos" className="text-xs uppercase tracking-widest text-ink-muted hover:text-ink">← Productos</Link>
      <div className="mb-8 mt-3 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-4xl">{p.brand} {p.name} <span className="text-ink-muted">{p.reference}</span></h1>
        <div className="flex gap-3">
          <Link href={`/admin/inventario?producto=${p.id}`} className="btn-outline px-4 py-2 text-xs">Stock: {p.stock} uds.</Link>
          <Link href={`/producto/${p.slug}`} target="_blank" className="btn-outline px-4 py-2 text-xs">Ver en tienda</Link>
        </div>
      </div>
      {creado && <p className="mb-6 border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">Producto creado.</p>}
      <ProductForm
        categories={cats.map((c) => c.category)}
        product={{
          id: p.id, name: p.name, brand: p.brand, reference: p.reference, category: p.category, description: p.description,
          price: toEuro(p.price), compareAtPrice: p.compareAtPrice ? toEuro(p.compareAtPrice) : "", lowStockThreshold: p.lowStockThreshold,
          featured: p.featured, active: p.active, images: parseImages(p.images),
          specs: Object.entries(parseSpecs(p.specs)).map(([k, v]) => `${k}: ${v}`).join("\n"),
        }}
      />
    </>
  );
}
