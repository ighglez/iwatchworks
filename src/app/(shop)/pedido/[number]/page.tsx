import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderForViewer } from "@/lib/order-access";
import { euros } from "@/lib/money";
import { ORDER_STATUS } from "@/lib/config";
import { CheckIcon } from "@/components/icons";
import ReviewForm from "@/components/forms/ReviewForm";

export const metadata: Metadata = { title: "Tu pedido", robots: { index: false } };
export const dynamic = "force-dynamic";

const FLOW = ["PAID", "PREPARING", "SHIPPED", "DELIVERED"];
const FLOW_LABEL: Record<string, string> = { PAID: "Pagado", PREPARING: "En preparación", SHIPPED: "Enviado", DELIVERED: "Entregado" };

export default async function OrderPage({ params, searchParams }: { params: Promise<{ number: string }>; searchParams: Promise<{ t?: string }> }) {
  const { number } = await params;
  const { t } = await searchParams;
  const order = await getOrderForViewer(number, t);
  if (!order) notFound();
  const step = FLOW.indexOf(order.status);
  const st = ORDER_STATUS[order.status];
  const tokenQs = t ? `?t=${encodeURIComponent(t)}` : "";

  return (
    <div className="container-x max-w-4xl py-12 md:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Pedido</p>
          <h1 className="mt-2 text-4xl md:text-5xl">{order.number}</h1>
          <p className="mt-2 text-sm text-ink-muted">Realizado el {order.createdAt.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
        <span className={`rounded-full border px-3 py-1.5 text-xs uppercase tracking-widest ${st?.tone}`}>{st?.label}</span>
      </div>

      {step >= 0 && (
        <ol className="mt-10 grid grid-cols-4 gap-2">
          {FLOW.map((s, i) => (
            <li key={s} className="text-center">
              <div className={`h-1 rounded-full ${i <= step ? "bg-gold" : "bg-line"}`} />
              <p className={`mt-3 flex items-center justify-center gap-1 text-[11px] uppercase tracking-widest ${i <= step ? "text-ink" : "text-ink-muted"}`}>
                {i <= step && <CheckIcon className="h-3.5 w-3.5 text-gold-dark" />} {FLOW_LABEL[s]}
              </p>
            </li>
          ))}
        </ol>
      )}

      {order.trackingNumber && (
        <div className="mt-8 rounded-2xl border border-gold-light bg-gold-soft/60 p-5 text-sm">
          <p className="font-medium">Tu reloj está en camino</p>
          <p className="mt-1 text-ink-soft">{order.carrier} · Seguimiento: <b className="text-ink">{order.trackingNumber}</b></p>
        </div>
      )}

      <div className="mt-10 grid gap-8 md:grid-cols-[1.4fr_1fr]">
        <div className="card p-6">
          <h2 className="text-2xl">Artículos</h2>
          <ul className="mt-4 divide-y divide-line">
            {order.items.map((i) => (
              <li key={i.id} className="flex justify-between gap-4 py-3 text-sm">
                <span>{i.name} <span className="text-ink-muted">· Ref. {i.reference} × {i.quantity}</span></span>
                <span className="tabular-nums">{euros(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-1.5 border-t border-line pt-3 text-sm">
            <div className="flex justify-between"><dt className="text-ink-soft">Subtotal</dt><dd>{euros(order.subtotal)}</dd></div>
            {order.welcomeDiscount > 0 && <div className="flex justify-between text-emerald-700"><dt>Bienvenida 5%</dt><dd>−{euros(order.welcomeDiscount)}</dd></div>}
            {order.pointsDiscount > 0 && <div className="flex justify-between text-emerald-700"><dt>{order.pointsRedeemed} puntos</dt><dd>−{euros(order.pointsDiscount)}</dd></div>}
            <div className="flex justify-between"><dt className="text-ink-soft">Envío asegurado</dt><dd>{order.shipping ? euros(order.shipping) : "Gratis"}</dd></div>
            <div className="flex justify-between border-t border-line pt-2 font-display text-xl"><dt>Total</dt><dd>{euros(order.total)}</dd></div>
          </dl>
        </div>
        <div className="space-y-6">
          <div className="card p-6 text-sm">
            <h2 className="text-2xl">Envío</h2>
            <p className="mt-3 leading-relaxed text-ink-soft">{order.name}<br />{order.address}<br />{order.postalCode} {order.city}<br />{order.province}<br />{order.phone}</p>
          </div>
          {step >= 0 && (
            <a href={`/factura/${order.number}${tokenQs}`} target="_blank" className="btn-outline w-full">Descargar factura</a>
          )}
          <Link href="/#contacto" className="btn-ghost w-full text-xs uppercase tracking-widest">¿Necesitas ayuda?</Link>
        </div>
      </div>
      {order.status === "DELIVERED" && (
        <div className="mt-10"><ReviewForm order={order.number} token={t ?? order.accessToken} /></div>
      )}
    </div>
  );
}
