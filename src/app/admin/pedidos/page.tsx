import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { euros } from "@/lib/money";
import { ORDER_STATUS } from "@/lib/config";
import { PageTitle, StatusPill, Table, fmtDate } from "../ui";

export const metadata = { title: "Pedidos" };

export default async function Pedidos({ searchParams }: { searchParams: Promise<{ estado?: string; q?: string }> }) {
  const { estado, q } = await searchParams;
  const where: Prisma.OrderWhereInput = {
    ...(estado && ORDER_STATUS[estado] ? { status: estado } : { status: { not: "PENDING" } }),
    ...(q ? { OR: [{ number: { contains: q.toUpperCase(), mode: "insensitive" } }, { email: { contains: q.toLowerCase(), mode: "insensitive" } }, { name: { contains: q, mode: "insensitive" } }] } : {}),
  };
  const [orders, counts] = await Promise.all([
    db.order.findMany({ where, orderBy: { createdAt: "desc" }, take: 200, include: { items: true } }),
    db.order.groupBy({ by: ["status"], _count: true }),
  ]);
  const count = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;
  const tab = (s: string | undefined, label: string, n?: number) => (
    <Link href={s ? `/admin/pedidos?estado=${s}` : "/admin/pedidos"} className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm ${estado === s ? "border-gold text-ink" : "border-transparent text-ink-muted hover:text-ink"}`}>
      {label}{n ? <span className="ml-1.5 text-xs">({n})</span> : null}
    </Link>
  );

  return (
    <>
      <PageTitle title="Pedidos">
        <form className="flex gap-2">
          {estado && <input type="hidden" name="estado" value={estado} />}
          <input name="q" defaultValue={q} placeholder="Nº, email o nombre" className="input w-60 py-2" aria-label="Buscar pedidos" />
          <button className="btn-primary px-4 py-2">Buscar</button>
        </form>
      </PageTitle>
      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-line">
        {tab(undefined, "Todos")}
        {tab("PAID", "Por preparar", count("PAID"))}
        {tab("PREPARING", "En preparación", count("PREPARING"))}
        {tab("SHIPPED", "Enviados", count("SHIPPED"))}
        {tab("DELIVERED", "Entregados")}
        {tab("CANCELLED", "Cancelados")}
        {tab("REFUNDED", "Reembolsados")}
        {tab("PENDING", "Sin pagar", count("PENDING"))}
      </div>
      <Table head={["Pedido", "Fecha", "Cliente", "Artículos", "Estado", "Total"]}>
        {orders.map((o) => (
          <tr key={o.id} className="hover:bg-ivory">
            <td className="px-4 py-3"><Link href={`/admin/pedidos/${o.id}`} className="font-medium hover:text-gold-dark">{o.number}</Link></td>
            <td className="whitespace-nowrap px-4 py-3 text-ink-muted">{fmtDate(o.createdAt)}</td>
            <td className="px-4 py-3">{o.name}<br /><span className="text-xs text-ink-muted">{o.email}{o.userId ? " · cliente registrado" : ""}</span></td>
            <td className="px-4 py-3 text-ink-soft">{o.items.map((i) => `${i.quantity}× ${i.reference}`).join(", ")}</td>
            <td className="px-4 py-3"><StatusPill status={o.status} /></td>
            <td className="px-4 py-3 text-right tabular-nums">{euros(o.total)}</td>
          </tr>
        ))}
        {orders.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-ink-muted">No hay pedidos en esta vista.</td></tr>}
      </Table>
    </>
  );
}
