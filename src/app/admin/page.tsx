import Link from "next/link";
import { db } from "@/lib/db";
import { euros } from "@/lib/money";
import { releaseExpiredReservations } from "@/lib/orders";
import { PageTitle, StatusPill, Table, fmtDate } from "./ui";

const PAID = ["PAID", "PREPARING", "SHIPPED", "DELIVERED"];

export default async function Dashboard() {
  await releaseExpiredReservations();
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start30 = new Date(Date.now() - 30 * 864e5);

  const [today, month, toShip, customers, recent, products] = await Promise.all([
    db.order.aggregate({ where: { status: { in: PAID }, paidAt: { gte: startToday } }, _sum: { total: true }, _count: true }),
    db.order.aggregate({ where: { status: { in: PAID }, paidAt: { gte: start30 } }, _sum: { total: true }, _count: true }),
    db.order.count({ where: { status: { in: ["PAID", "PREPARING"] } } }),
    db.user.count({ where: { role: "CUSTOMER" } }),
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    db.product.findMany({ where: { active: true }, orderBy: { stock: "asc" } }),
  ]);
  const lowStock = products.filter((p) => p.stock <= p.lowStockThreshold);
  const avg = month._count ? Math.round((month._sum.total ?? 0) / month._count) : 0;

  const kpis = [
    ["Ventas hoy", euros(today._sum.total ?? 0), `${today._count} pedidos`],
    ["Últimos 30 días", euros(month._sum.total ?? 0), `${month._count} pedidos`],
    ["Ticket medio", euros(avg), "30 días"],
    ["Por enviar", String(toShip), `${customers} clientes registrados`],
  ];

  return (
    <>
      <PageTitle title="Resumen" subtitle={now.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(([label, value, sub]) => (
          <div key={label} className="card p-5">
            <p className="text-[11px] uppercase tracking-widest text-ink-muted">{label}</p>
            <p className="mt-2 font-serif text-4xl tabular-nums">{value}</p>
            <p className="mt-1 text-xs text-ink-muted">{sub}</p>
          </div>
        ))}
      </div>

      {toShip > 0 && (
        <Link href="/admin/pedidos?estado=PAID" className="mt-6 flex items-center justify-between border border-gold bg-gold-soft px-5 py-4 text-sm hover:bg-gold-light">
          <span><b>{toShip} {toShip === 1 ? "pedido pagado espera" : "pedidos pagados esperan"}</b> preparación y envío.</span>
          <span className="uppercase tracking-widest">Gestionar →</span>
        </Link>
      )}

      <div className="mt-8 grid gap-8 xl:grid-cols-[1.6fr_1fr]">
        <section>
          <h2 className="mb-3 text-2xl">Últimos pedidos</h2>
          <Table head={["Pedido", "Cliente", "Fecha", "Estado", "Total"]}>
            {recent.map((o) => (
              <tr key={o.id} className="hover:bg-ivory">
                <td className="px-4 py-3"><Link href={`/admin/pedidos/${o.id}`} className="font-medium hover:text-gold-dark">{o.number}</Link></td>
                <td className="px-4 py-3">{o.name}</td>
                <td className="whitespace-nowrap px-4 py-3 text-ink-muted">{fmtDate(o.createdAt)}</td>
                <td className="px-4 py-3"><StatusPill status={o.status} /></td>
                <td className="px-4 py-3 text-right tabular-nums">{euros(o.total)}</td>
              </tr>
            ))}
            {recent.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-ink-muted">Todavía no hay pedidos.</td></tr>}
          </Table>
        </section>
        <section>
          <h2 className="mb-3 text-2xl">Stock bajo</h2>
          <div className="card divide-y divide-line">
            {lowStock.length === 0 && <p className="p-5 text-sm text-ink-muted">Todo el catálogo tiene stock suficiente.</p>}
            {lowStock.map((p) => (
              <Link key={p.id} href={`/admin/inventario?producto=${p.id}`} className="flex items-center justify-between px-5 py-3 text-sm hover:bg-ivory">
                <span>{p.brand} {p.name} <span className="text-ink-muted">· {p.reference}</span></span>
                <span className={`font-medium ${p.stock === 0 ? "text-rose-700" : "text-amber-700"}`}>{p.stock === 0 ? "Agotado" : `${p.stock} ${p.stock === 1 ? "ud." : "uds."}`}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
