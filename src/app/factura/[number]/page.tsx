import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getOrderForViewer } from "@/lib/order-access";
import { euros } from "@/lib/money";
import { SITE } from "@/lib/config";
import PrintButton from "./PrintButton";

export const metadata: Metadata = { title: "Factura", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Factura({ params, searchParams }: { params: Promise<{ number: string }>; searchParams: Promise<{ t?: string }> }) {
  const order = await getOrderForViewer((await params).number, (await searchParams).t);
  if (!order || !order.paidAt) notFound();
  const base = Math.round(order.total / (1 + SITE.vatRate / 100));
  const vat = order.total - base;

  return (
    <div className="mx-auto max-w-3xl bg-white p-10 text-sm text-ink print:p-0">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-serif text-3xl">IWatch<span className="text-gold-dark">Works</span></p>
          <p className="mt-2 text-xs leading-relaxed text-ink-soft">{SITE.legal.company}<br />{SITE.legal.taxId}<br />{SITE.legal.address}</p>
        </div>
        <div className="text-right">
          <p className="font-serif text-2xl">Factura</p>
          <p className="text-xs text-ink-soft">Nº F-{order.number.replace("IW-", "")}<br />Fecha: {order.paidAt.toLocaleDateString("es-ES")}</p>
        </div>
      </div>
      <div className="mt-8 border-t border-line pt-4 text-xs">
        <p className="font-medium uppercase tracking-widest text-ink-muted">Cliente</p>
        <p className="mt-1">{order.name}<br />{order.address}, {order.postalCode} {order.city} ({order.province})<br />{order.email}</p>
      </div>
      <table className="mt-8 w-full text-left">
        <thead className="border-b border-ink text-xs uppercase tracking-widest">
          <tr><th className="py-2">Concepto</th><th className="py-2 text-right">Ud.</th><th className="py-2 text-right">Precio</th><th className="py-2 text-right">Importe</th></tr>
        </thead>
        <tbody>
          {order.items.map((i) => (
            <tr key={i.id} className="border-b border-line">
              <td className="py-2">{i.name} · Ref. {i.reference}</td>
              <td className="py-2 text-right">{i.quantity}</td>
              <td className="py-2 text-right">{euros(i.price)}</td>
              <td className="py-2 text-right">{euros(i.price * i.quantity)}</td>
            </tr>
          ))}
          {order.welcomeDiscount > 0 && <tr><td colSpan={3} className="py-2">Descuento bienvenida</td><td className="py-2 text-right">−{euros(order.welcomeDiscount)}</td></tr>}
          {order.pointsDiscount > 0 && <tr><td colSpan={3} className="py-2">Descuento por puntos</td><td className="py-2 text-right">−{euros(order.pointsDiscount)}</td></tr>}
          <tr><td colSpan={3} className="py-2">Envío asegurado</td><td className="py-2 text-right">{euros(order.shipping)}</td></tr>
        </tbody>
      </table>
      <dl className="ml-auto mt-6 w-64 space-y-1">
        <div className="flex justify-between"><dt>Base imponible</dt><dd>{euros(base)}</dd></div>
        <div className="flex justify-between"><dt>IVA {SITE.vatRate}%</dt><dd>{euros(vat)}</dd></div>
        <div className="flex justify-between border-t border-ink pt-1 font-medium"><dt>Total</dt><dd>{euros(order.total)}</dd></div>
      </dl>
      <div className="mt-10 print:hidden"><PrintButton /></div>
    </div>
  );
}
