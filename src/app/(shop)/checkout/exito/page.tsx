import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderForViewer } from "@/lib/order-access";
import { markOrderPaid } from "@/lib/orders";
import { getStripe, stripeEnabled } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/auth";
import { euros } from "@/lib/money";
import { CheckIcon, GiftIcon } from "@/components/icons";
import ClearPurchased from "./ClearPurchased";
import ClaimAccount from "./ClaimAccount";
import TransferDetails from "@/components/checkout/TransferDetails";
import { transferProps } from "@/lib/transfer-view";

export const metadata: Metadata = { title: "Pedido recibido", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Exito({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  let order = await getOrderForViewer(sp.order ?? "", sp.t);
  if (!order) notFound();

  // Si el webhook aún no ha llegado, confirmamos directamente con Stripe.
  if (order.status === "PENDING" && stripeEnabled() && order.stripeSessionId && sp.session_id === order.stripeSessionId) {
    const s = await getStripe().checkout.sessions.retrieve(order.stripeSessionId);
    if (s.payment_status === "paid") {
      await markOrderPaid(order.id, typeof s.payment_intent === "string" ? s.payment_intent : s.payment_intent?.id);
      order = (await getOrderForViewer(order.number, order.accessToken))!;
    }
  }
  const paid = order.status !== "PENDING" && order.status !== "CANCELLED";
  const awaitingTransfer = order.status === "PENDING" && order.paymentProvider === "transfer";
  const user = await getCurrentUser();

  return (
    <div className="container-x max-w-3xl py-14 md:py-20">
      <ClearPurchased ids={order.items.map((i) => i.productId).filter(Boolean) as string[]} />
      <div className="text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold text-white">
          <CheckIcon className="h-8 w-8" />
        </span>
        <p className="eyebrow mt-6">Pedido {order.number}</p>
        <h1 className="mt-3 text-4xl md:text-5xl">{paid || awaitingTransfer ? `¡Gracias, ${order.name.split(" ")[0]}!` : "Estamos confirmando tu pago"}</h1>
        <p className="mx-auto mt-4 max-w-lg text-ink-soft">
          {awaitingTransfer
            ? `Hemos recibido tu pedido y tu reloj ya está reservado. Solo falta la transferencia: te hemos enviado estos mismos datos a ${order.email}.`
            : paid
              ? `Tu pago se ha completado. Hemos enviado la confirmación a ${order.email}. Te avisaremos con el número de seguimiento en cuanto salga tu reloj.`
              : "Puede tardar unos segundos. Recarga esta página en un momento; te enviaremos un email en cuanto se confirme."}
        </p>
      </div>

      {awaitingTransfer && (
        <div className="mt-10">
          <TransferDetails {...await transferProps(order)} />
        </div>
      )}

      <div className="card mt-10 p-6 md:p-8">
        <ul className="divide-y divide-line">
          {order.items.map((i) => (
            <li key={i.id} className="flex justify-between py-3 text-sm">
              <span>{i.name} <span className="text-ink-muted">× {i.quantity}</span></span>
              <span className="tabular-nums">{euros(i.price * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-line pt-4">
          <span>{paid ? "Total pagado" : "Total del pedido"}</span>
          <span className="font-display text-2xl tabular-nums">{euros(order.total)}</span>
        </div>
        <p className="mt-4 text-sm text-ink-soft">
          Envío a: {order.name}, {order.address}, {order.postalCode} {order.city} ({order.province})
        </p>
      </div>

      {paid && order.userId && order.pointsEarned > 0 && (
        <p className="mt-6 flex items-center justify-center gap-2 text-sm text-gold-dark">
          <GiftIcon className="h-4 w-4" /> Has sumado {order.pointsEarned} puntos a tu cuenta.
        </p>
      )}

      {paid && !order.userId && !user && <ClaimAccount order={order.number} token={order.accessToken} points={Math.floor(order.total / 100)} />}

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link href={`/pedido/${order.number}?t=${order.accessToken}`} className="btn-primary">Ver estado del pedido</Link>
        <Link href="/tienda" className="btn-outline">Seguir comprando</Link>
      </div>
    </div>
  );
}
