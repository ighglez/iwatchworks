import Link from "next/link";
import { db } from "@/lib/db";
import { euros } from "@/lib/money";
import { codeLabel } from "@/lib/discounts";
import { RULES } from "@/lib/config";
import { deleteDiscountCode, toggleDiscountCode } from "@/app/actions/discounts";
import ConfirmButton from "../ConfirmButton";
import { PageTitle, Table } from "../ui";
import CodeForm from "./CodeForm";

export const metadata = { title: "Descuentos" };
export const dynamic = "force-dynamic";

const day = (d: Date) => d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Madrid" });

export default async function Descuentos() {
  const codes = await db.discountCode.findMany({ orderBy: [{ active: "desc" }, { createdAt: "desc" }] });
  const savings = await db.order.groupBy({
    by: ["discountCode"],
    where: { discountCode: { in: codes.map((c) => c.code) }, status: { notIn: ["CANCELLED", "REFUNDED"] } },
    _sum: { codeDiscount: true, total: true },
  });
  const now = new Date();

  return (
    <>
      <PageTitle title="Descuentos" subtitle="Crea códigos para tus clientes. Se escriben en el pago, en «¿Tienes un código de descuento?»." />
      <CodeForm />
      <p className="mt-3 text-xs text-ink-muted">
        Un código no se suma al {RULES.welcomeDiscountPercent}% de bienvenida: se aplica el que más ahorre al cliente (y si gana el código, el 5% le queda para otra compra). Los puntos sí se pueden usar además.
      </p>

      <section className="mt-10">
        <h2 className="mb-3 text-2xl">Tus códigos</h2>
        {codes.length === 0 ? (
          <p className="card p-6 text-sm text-ink-soft">Aún no has creado ningún código.</p>
        ) : (
          <Table head={["Código", "Descuento", "Condiciones", "Usos", "Ventas", "Estado", ""]}>
            {codes.map((c) => {
              const s = savings.find((x) => x.discountCode === c.code);
              const expired = c.expiresAt && c.expiresAt < now;
              const soldOut = c.maxUses != null && c.uses >= c.maxUses;
              const notYet = c.startsAt && c.startsAt > now;
              const state = !c.active ? ["Desactivado", "text-ink-muted"] : expired ? ["Caducado", "text-ink-muted"] : soldOut ? ["Agotado", "text-amber-700"] : notYet ? [`Desde ${day(c.startsAt!)}`, "text-sky-700"] : ["Activo", "text-emerald-700"];
              const cond = [
                c.minSubtotal ? `desde ${euros(c.minSubtotal)}` : null,
                c.onePerCustomer ? "1 por cliente" : null,
                c.expiresAt ? `hasta ${day(c.expiresAt)}` : null,
              ].filter(Boolean).join(" · ") || "Sin condiciones";
              return (
                <tr key={c.id} className={c.active ? "" : "opacity-60"}>
                  <td className="px-4 py-3">
                    <span className="font-semibold tracking-wider">{c.code}</span>
                    {c.description && <span className="block text-xs text-ink-muted">{c.description}</span>}
                  </td>
                  <td className="px-4 py-3 font-medium">{codeLabel(c)}</td>
                  <td className="px-4 py-3 text-ink-soft">{cond}</td>
                  <td className="whitespace-nowrap px-4 py-3">{c.uses}{c.maxUses != null && <span className="text-ink-muted"> / {c.maxUses}</span>}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-soft">
                    {s?._sum.total ? <>{euros(s._sum.total)}<span className="block text-xs text-ink-muted">−{euros(s._sum.codeDiscount ?? 0)} descontado</span></> : "—"}
                  </td>
                  <td className={`whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-widest ${state[1]}`}>{state[0]}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <form action={toggleDiscountCode} className="inline">
                      <input type="hidden" name="id" value={c.id} />
                      <button className="text-xs link-gold">{c.active ? "Desactivar" : "Activar"}</button>
                    </form>
                    <form action={deleteDiscountCode} className="ml-4 inline">
                      <input type="hidden" name="id" value={c.id} />
                      <ConfirmButton message={c.uses > 0 ? `${c.code} ya se ha usado: se desactivará y se conservará en los pedidos. ¿Seguir?` : `¿Borrar el código ${c.code}?`} className="text-xs text-rose-700 hover:underline">Borrar</ConfirmButton>
                    </form>
                  </td>
                </tr>
              );
            })}
          </Table>
        )}
        <p className="mt-3 text-xs text-ink-muted">Los usos cuentan los pedidos hechos con el código, incluidos los pendientes de transferencia; si un pedido se cancela, el uso se devuelve. Puedes ver cada pedido en <Link href="/admin/pedidos" className="link-gold">Pedidos</Link>.</p>
      </section>
    </>
  );
}
