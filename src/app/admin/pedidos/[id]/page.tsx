import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { euros } from "@/lib/money";
import { RULES } from "@/lib/config";
import { stripeEnabled } from "@/lib/stripe";
import { adminCancelOrder, saveAdminNotes, updateOrderStatus } from "@/app/actions/admin";
import { StatusPill, fmtDate } from "../../ui";
import ConfirmButton from "../../ConfirmButton";

export const metadata = { title: "Pedido" };

const CARRIERS = ["SEUR", "MRW", "Correos Express", "DHL", "UPS", "GLS", "Nacex"];

export default async function PedidoAdmin({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await db.order.findUnique({
    where: { id },
    include: { items: true, events: { orderBy: { createdAt: "desc" } }, user: true },
  });
  if (!order) notFound();
  const active = !["CANCELLED", "REFUNDED"].includes(order.status);
  const paid = ["PAID", "PREPARING", "SHIPPED", "DELIVERED"].includes(order.status);

  return (
    <>
      <Link href="/admin/pedidos" className="text-xs uppercase tracking-widest text-ink-muted hover:text-ink">← Pedidos</Link>
      <div className="mb-8 mt-3 flex flex-wrap items-center gap-4">
        <h1 className="text-4xl">{order.number}</h1>
        <StatusPill status={order.status} />
        <span className="text-sm text-ink-muted">{fmtDate(order.createdAt)}</span>
        {paid && <a href={`/factura/${order.number}`} target="_blank" className="btn-outline ml-auto px-4 py-2 text-xs">Factura</a>}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          {/* ACCIONES */}
          {active && order.status !== "DELIVERED" && (
            <section className="card border-gold p-6">
              <h2 className="text-2xl">Siguiente paso</h2>
              {order.status === "PENDING" && (
                <div className="mt-3 text-sm text-ink-soft">
                  {order.paymentProvider === "transfer" ? (
                    <p>Esperando la transferencia de <b className="text-ink">{euros(order.total)}</b> con el concepto <b className="text-ink">{order.number}</b>. Cuando la veas en el banco, márcala como recibida: el cliente recibirá la confirmación y sus puntos. Si no llega en {RULES.transferDays} días, el pedido se cancela solo y el reloj vuelve a estar disponible.</p>
                  ) : (
                    <p>El cliente no ha completado el pago. El stock queda reservado unos minutos y se libera solo si no paga.</p>
                  )}
                  <form action={updateOrderStatus} className="mt-4">
                    <input type="hidden" name="id" value={order.id} />
                    <input type="hidden" name="status" value="PAID" />
                    <ConfirmButton message={order.paymentProvider === "transfer" ? `¿Confirmas que has recibido la transferencia de ${euros(order.total)}?` : "¿Confirmas que has recibido el pago por otra vía?"} className={order.paymentProvider === "transfer" ? "btn-primary" : "btn-outline px-4 py-2 text-xs"}>{order.paymentProvider === "transfer" ? "Transferencia recibida" : "Marcar como pagado manualmente"}</ConfirmButton>
                  </form>
                </div>
              )}
              {order.status === "PAID" && (
                <form action={updateOrderStatus} className="mt-4">
                  <input type="hidden" name="id" value={order.id} />
                  <input type="hidden" name="status" value="PREPARING" />
                  <button className="btn-primary">Empezar a preparar</button>
                </form>
              )}
              {(order.status === "PAID" || order.status === "PREPARING") && (
                <form action={updateOrderStatus} className="mt-5 grid gap-3 border-t border-line pt-5 sm:grid-cols-[1fr_1.3fr_auto] sm:items-end">
                  <input type="hidden" name="id" value={order.id} />
                  <input type="hidden" name="status" value="SHIPPED" />
                  <div>
                    <label className="label" htmlFor="carrier">Agencia</label>
                    <select id="carrier" name="carrier" required className="input py-2.5">{CARRIERS.map((c) => <option key={c}>{c}</option>)}</select>
                  </div>
                  <div>
                    <label className="label" htmlFor="tracking">Nº de seguimiento</label>
                    <input id="tracking" name="tracking" required minLength={3} className="input py-2.5" />
                  </div>
                  <button className="btn-gold py-3">Marcar enviado y avisar</button>
                </form>
              )}
              {order.status === "SHIPPED" && (
                <form action={updateOrderStatus} className="mt-4">
                  <input type="hidden" name="id" value={order.id} />
                  <input type="hidden" name="status" value="DELIVERED" />
                  <p className="mb-3 text-sm text-ink-soft">{order.carrier} · {order.trackingNumber}</p>
                  <button className="btn-primary">Marcar como entregado</button>
                </form>
              )}
            </section>
          )}

          <section className="card p-6">
            <h2 className="text-2xl">Artículos</h2>
            <ul className="mt-3 divide-y divide-line text-sm">
              {order.items.map((i) => (
                <li key={i.id} className="flex justify-between gap-4 py-3">
                  <span>
                    {i.productId ? <Link href={`/admin/productos/${i.productId}`} className="hover:text-gold-dark">{i.name}</Link> : i.name}
                    <span className="text-ink-muted"> · Ref. {i.reference} × {i.quantity}</span>
                  </span>
                  <span className="tabular-nums">{euros(i.price * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-2 space-y-1 border-t border-line pt-3 text-sm">
              <div className="flex justify-between"><dt className="text-ink-muted">Subtotal</dt><dd>{euros(order.subtotal)}</dd></div>
              {order.welcomeDiscount > 0 && <div className="flex justify-between"><dt className="text-ink-muted">Bienvenida 5%</dt><dd>−{euros(order.welcomeDiscount)}</dd></div>}
              {order.codeDiscount > 0 && <div className="flex justify-between"><dt className="text-ink-muted">Código {order.discountCode}</dt><dd>−{euros(order.codeDiscount)}</dd></div>}
              {order.pointsDiscount > 0 && <div className="flex justify-between"><dt className="text-ink-muted">Puntos ({order.pointsRedeemed})</dt><dd>−{euros(order.pointsDiscount)}</dd></div>}
              <div className="flex justify-between"><dt className="text-ink-muted">Envío</dt><dd>{euros(order.shipping)}</dd></div>
              <div className="flex justify-between font-display text-xl"><dt>Total</dt><dd>{euros(order.total)}</dd></div>
            </dl>
            <p className="mt-3 text-xs text-ink-muted">
              Pago: {{ demo: "demostración", transfer: "transferencia bancaria" }[order.paymentProvider] ?? "Stripe"}{order.stripePaymentIntent ? ` · ${order.stripePaymentIntent}` : ""}
            </p>
          </section>

          <section className="card p-6">
            <h2 className="text-2xl">Historial</h2>
            <ol className="mt-4 space-y-3 border-l border-line pl-5 text-sm">
              {order.events.map((e) => (
                <li key={e.id} className="relative">
                  <span className={`absolute -left-[25px] top-1.5 h-2 w-2 rounded-full ${e.type === "WARNING" ? "bg-rose-500" : "bg-gold"}`} />
                  <p className={e.type === "WARNING" ? "text-rose-700" : ""}>{e.message}</p>
                  <p className="text-xs text-ink-muted">{fmtDate(e.createdAt)}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <div className="space-y-6">
          <section className="card p-6 text-sm">
            <h2 className="text-2xl">Cliente</h2>
            <p className="mt-3 leading-relaxed">
              <b className="font-medium">{order.name}</b><br />
              <a href={`mailto:${order.email}`} className="link-gold">{order.email}</a><br />
              <a href={`tel:${order.phone}`}>{order.phone}</a>
            </p>
            <p className="mt-2 text-xs text-ink-muted">{order.user ? `Cliente registrado · ${order.user.points} puntos` : "Compra como invitado"}</p>
            <h3 className="mt-5 text-lg">Dirección de envío</h3>
            <p className="mt-1 leading-relaxed text-ink-soft">{order.address}<br />{order.postalCode} {order.city}<br />{order.province}</p>
            {order.customerNotes && (
              <p className="mt-4 border-l-2 border-gold bg-gold-soft/50 p-3 text-ink-soft"><b className="text-ink">Nota del cliente:</b> {order.customerNotes}</p>
            )}
          </section>

          <section className="card p-6">
            <h2 className="text-2xl">Notas internas</h2>
            <form action={saveAdminNotes} className="mt-3 space-y-3">
              <input type="hidden" name="id" value={order.id} />
              <textarea name="notes" rows={3} defaultValue={order.adminNotes ?? ""} className="input resize-none" aria-label="Notas internas" placeholder="Solo visibles para administración" />
              <button className="btn-outline px-4 py-2 text-xs">Guardar nota</button>
            </form>
          </section>

          {active && (
            <section className="card border-rose-200 p-6">
              <h2 className="text-2xl">{paid ? "Cancelar y reembolsar" : "Cancelar pedido"}</h2>
              <p className="mt-2 text-xs text-ink-muted">Devuelve el stock y ajusta los puntos del cliente automáticamente.</p>
              <form action={adminCancelOrder} className="mt-4 space-y-3">
                <input type="hidden" name="id" value={order.id} />
                <input name="reason" placeholder="Motivo" className="input py-2" required />
                {paid && stripeEnabled() && order.stripePaymentIntent && (
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="refund" defaultChecked className="accent-gold" /> Reembolsar el pago en Stripe</label>
                )}
                <ConfirmButton message="¿Seguro que quieres cancelar este pedido?" className="btn border border-rose-300 px-4 py-2 text-xs text-rose-700 hover:bg-rose-50">
                  {paid ? "Cancelar y reembolsar" : "Cancelar pedido"}
                </ConfirmButton>
              </form>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
