import { db } from "@/lib/db";
import { euros } from "@/lib/money";
import { adjustPoints } from "@/app/actions/admin";
import { PageTitle, Table, fmtDate } from "../ui";

export const metadata = { title: "Clientes" };

export default async function Clientes({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const users = await db.user.findMany({
    where: { role: "CUSTOMER", ...(q ? { OR: [{ email: { contains: q.toLowerCase(), mode: "insensitive" } }, { name: { contains: q, mode: "insensitive" } }] } : {}) },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { orders: { where: { status: { in: ["PAID", "PREPARING", "SHIPPED", "DELIVERED"] } }, select: { total: true } } },
  });
  const guests = await db.order.groupBy({ by: ["email"], where: { userId: null, status: { in: ["PAID", "PREPARING", "SHIPPED", "DELIVERED"] } }, _count: true, _sum: { total: true } });
  const subs = await db.newsletterSubscriber.count();

  return (
    <>
      <PageTitle title="Clientes" subtitle={`${users.length} registrados · ${guests.length} compradores invitados · ${subs} suscritos a la newsletter`}>
        <form className="flex gap-2">
          <input name="q" defaultValue={q} placeholder="Nombre o email" className="input w-56 py-2" aria-label="Buscar clientes" />
          <button className="btn-primary px-4 py-2">Buscar</button>
        </form>
      </PageTitle>
      <Table head={["Cliente", "Alta", "Pedidos", "Gastado", "Puntos", "Ajustar puntos"]}>
        {users.map((u) => (
          <tr key={u.id} className="hover:bg-ivory">
            <td className="px-4 py-2.5">{u.name}<span className="block text-xs text-ink-muted">{u.email}{u.marketingOptIn ? " · newsletter" : ""}</span></td>
            <td className="whitespace-nowrap px-4 py-2.5 text-ink-muted">{fmtDate(u.createdAt)}</td>
            <td className="px-4 py-2.5">{u.orders.length}</td>
            <td className="px-4 py-2.5 tabular-nums">{euros(u.orders.reduce((s, o) => s + o.total, 0))}</td>
            <td className="px-4 py-2.5 font-medium text-gold-dark">{u.points}</td>
            <td className="px-4 py-2.5">
              <form action={adjustPoints} className="flex gap-2">
                <input type="hidden" name="userId" value={u.id} />
                <input name="points" type="number" placeholder="±" className="input w-20 py-1.5" aria-label="Puntos" required />
                <button className="btn-outline px-3 py-1.5 text-xs">OK</button>
              </form>
            </td>
          </tr>
        ))}
        {users.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-ink-muted">Aún no hay clientes registrados.</td></tr>}
      </Table>
      {guests.length > 0 && (
        <>
          <h2 className="mb-3 mt-10 text-2xl">Compradores invitados</h2>
          <Table head={["Email", "Pedidos", "Gastado"]}>
            {guests.map((g) => (
              <tr key={g.email}><td className="px-4 py-2.5">{g.email}</td><td className="px-4 py-2.5">{g._count}</td><td className="px-4 py-2.5 tabular-nums">{euros(g._sum.total ?? 0)}</td></tr>
            ))}
          </Table>
        </>
      )}
    </>
  );
}
