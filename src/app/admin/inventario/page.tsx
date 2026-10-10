import Link from "next/link";
import { db } from "@/lib/db";
import { euros } from "@/lib/money";
import { PageTitle, Table, fmtDate } from "../ui";
import StockForm from "./StockForm";

export const metadata = { title: "Inventario" };

const REASON: Record<string, string> = {
  SALE_RESERVED: "Venta", RELEASED: "Reserva liberada", RESTOCK: "Entrada", ADJUSTMENT: "Ajuste", RETURN: "Devolución",
};

export default async function Inventario({ searchParams }: { searchParams: Promise<{ producto?: string }> }) {
  const { producto } = await searchParams;
  const [products, movements] = await Promise.all([
    db.product.findMany({ orderBy: [{ brand: "asc" }, { name: "asc" }] }),
    db.stockMovement.findMany({ where: producto ? { productId: producto } : {}, orderBy: { createdAt: "desc" }, take: 60, include: { product: true } }),
  ]);
  const units = products.reduce((s, p) => s + p.stock, 0);
  const value = products.reduce((s, p) => s + p.stock * p.price, 0);
  const orders = await db.order.findMany({ where: { id: { in: movements.map((m) => m.orderId).filter(Boolean) as string[] } }, select: { id: true, number: true } });

  return (
    <>
      <PageTitle title="Inventario" subtitle={`${units} unidades en stock · valor a PVP ${euros(value)}`} />
      <StockForm products={products.map((p) => ({ id: p.id, label: `${p.brand} ${p.name} · ${p.reference}`, stock: p.stock }))} selected={producto} />

      <div className="mt-8 grid gap-8 xl:grid-cols-[1fr_1.3fr]">
        <section>
          <h2 className="mb-3 text-2xl">Existencias</h2>
          <Table head={["Producto", "Stock", "Valor"]}>
            {products.map((p) => (
              <tr key={p.id} className={producto === p.id ? "bg-gold-soft/50" : "hover:bg-ivory"}>
                <td className="px-4 py-2.5"><Link href={`/admin/inventario?producto=${p.id}`} className="hover:text-gold-dark">{p.brand} {p.name}</Link><span className="block text-xs text-ink-muted">{p.reference}{p.active ? "" : " · oculto"}</span></td>
                <td className={`px-4 py-2.5 font-medium ${p.stock === 0 ? "text-rose-700" : p.stock <= p.lowStockThreshold ? "text-amber-700" : ""}`}>{p.stock}</td>
                <td className="px-4 py-2.5 tabular-nums text-ink-soft">{euros(p.stock * p.price)}</td>
              </tr>
            ))}
          </Table>
        </section>
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-2xl">Movimientos</h2>
            {producto && <Link href="/admin/inventario" className="text-xs link-gold">Ver todos</Link>}
          </div>
          <Table head={["Fecha", "Producto", "Cambio", "Stock", "Motivo"]}>
            {movements.map((m) => {
              const o = orders.find((x) => x.id === m.orderId);
              return (
                <tr key={m.id}>
                  <td className="whitespace-nowrap px-4 py-2.5 text-ink-muted">{fmtDate(m.createdAt)}</td>
                  <td className="px-4 py-2.5">{m.product.reference}</td>
                  <td className={`px-4 py-2.5 font-medium ${m.change > 0 ? "text-emerald-700" : "text-rose-700"}`}>{m.change > 0 ? "+" : ""}{m.change}</td>
                  <td className="px-4 py-2.5">{m.stockAfter}</td>
                  <td className="px-4 py-2.5 text-ink-soft">
                    {REASON[m.reason] ?? m.reason}
                    {o && <> · <Link href={`/admin/pedidos/${o.id}`} className="link-gold">{o.number}</Link></>}
                    {m.note && <span className="block text-xs text-ink-muted">{m.note}</span>}
                  </td>
                </tr>
              );
            })}
          </Table>
        </section>
      </div>
    </>
  );
}
