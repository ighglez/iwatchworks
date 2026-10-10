import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { cancelOrder, markOrderPaid } from "@/lib/orders";

// Stripe envía aquí los eventos de pago. La firma se verifica siempre.
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers.get("stripe-signature");
  if (!secret || !sig) return NextResponse.json({ error: "no configurado" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await req.text(), sig, secret);
  } catch {
    return NextResponse.json({ error: "firma no válida" }, { status: 400 });
  }

  const orderFromSession = async (s: Stripe.Checkout.Session) => {
    const id = s.metadata?.orderId;
    if (!id) return null;
    const order = await db.order.findUnique({ where: { id } });
    return order && order.stripeSessionId === s.id ? order : null;
  };

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const s = event.data.object as Stripe.Checkout.Session;
      const order = await orderFromSession(s);
      if (order && s.payment_status === "paid") {
        await markOrderPaid(order.id, typeof s.payment_intent === "string" ? s.payment_intent : s.payment_intent?.id);
      }
      break;
    }
    case "checkout.session.expired":
    case "checkout.session.async_payment_failed": {
      const order = await orderFromSession(event.data.object as Stripe.Checkout.Session);
      if (order?.status === "PENDING") await cancelOrder(order.id, { reason: "Pago no completado", actor: "stripe" });
      break;
    }
    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      const pi = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
      if (pi && charge.refunded) {
        const order = await db.order.findFirst({ where: { stripePaymentIntent: pi } });
        if (order && order.status !== "REFUNDED") await cancelOrder(order.id, { reason: "Reembolso desde Stripe", actor: "stripe" });
      }
      break;
    }
  }
  return NextResponse.json({ received: true });
}
