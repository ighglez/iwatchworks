import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { cancelOrder } from "@/lib/orders";
import { getStripe, stripeEnabled } from "@/lib/stripe";
import { timingSafeEqual } from "crypto";

// Stripe redirige aquí si el cliente vuelve atrás: liberamos el stock reservado al momento.
export async function GET(req: NextRequest) {
  const number = req.nextUrl.searchParams.get("order") ?? "";
  const token = req.nextUrl.searchParams.get("t") ?? "";
  const order = await db.order.findUnique({ where: { number } });
  const valid = order && token.length === order.accessToken.length && timingSafeEqual(Buffer.from(token), Buffer.from(order.accessToken));
  if (valid && order.status === "PENDING") {
    if (stripeEnabled() && order.stripeSessionId) {
      try {
        await getStripe().checkout.sessions.expire(order.stripeSessionId);
      } catch {}
    }
    const fresh = await db.order.findUnique({ where: { id: order.id } });
    if (fresh?.status === "PENDING") await cancelOrder(order.id, { reason: "Pago cancelado por el cliente", actor: "cliente" });
  }
  return NextResponse.redirect(new URL("/checkout?cancelado=1", req.url));
}
