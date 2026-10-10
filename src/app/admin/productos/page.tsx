import Link from "next/link";
import { db } from "@/lib/db";
import { euros } from "@/lib/money";
import { parseImages } from "@/lib/product";
import { toggleProduct } from "@/app/actions/admin";
import WatchImage from "@/components/WatchImage";
import { PageTitle, Table } from "../ui";

export const metadata = { title: "Productos" };

export default async function Productos() {
  const products = await db.product.findMany({ orderBy: [{ active: "desc" }, { createdAt: "desc" }], include: { _count: { select: { orderItems: true } } } });
  return (
    <>
      <PageTitle title="Productos" subtitle={`${products.length} relojes en el catálogo`}>
        <Link href="/admin/productos/nuevo" className="btn-primary">+ Nuevo producto</Link>
      </PageTitle>
      <Table head={["", "Producto", "Categoría", "Precio", "Stock", "Ventas", "Estado", ""]}>
        {products.map((p) => (
          <tr key={p.id} className={`hover:bg-ivory ${p.active ? "" : "opacity-50"}`}>
            <td className="px-4 py-2"><div className="h-12 w-12 overflow-hidden border border-line"><WatchImage src={parseImages(p.images)[0]} alt="" sizes="100px" className="h-full w-full" /></div></td>
            <td className="px-4 py-2">
              <Link href={`/admin/productos/${p.id}`} className="font-medium hover:text-gold-dark">{p.brand} {p.name}</Link>
              <p className="text-xs text-ink-muted">Ref. {p.reference}{p.featured ? " · ★ destacado" : ""}</p>
            </td>
            <td className="px-4 py-2 text-ink-soft">{p.category}</td>
            <td className="px-4 py-2 tabular-nums">{euros(p.price)}</td>
            <td className="px-4 py-2">
              <Link href={`/admin/inventario?producto=${p.id}`} className={`font-medium ${p.stock === 0 ? "text-rose-700" : p.stock <= p.lowStockThreshold ? "text-amber-700" : ""}`}>{p.stock} uds.</Link>
            </td>
            <td className="px-4 py-2 text-ink-soft">{p._count.orderItems}</td>
            <td className="px-4 py-2">
              <form action={toggleProduct}>
                <input type="hidden" name="id" value={p.id} />
                <button className={`border px-2 py-0.5 text-[10px] uppercase tracking-widest ${p.active ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-line text-ink-muted"}`} title="Cambiar visibilidad">
                  {p.active ? "Visible" : "Oculto"}
                </button>
              </form>
            </td>
            <td className="px-4 py-2 text-right">
              <Link href={`/producto/${p.slug}`} target="_blank" className="text-xs link-gold">Ver</Link>
            </td>
          </tr>
        ))}
      </Table>
    </>
  );
}
