import "server-only";
import { randomBytes } from "crypto";
import { db } from "./db";
import { RULES, SITE } from "./config";
import type { Quote } from "./pricing";
import { sendMail, escapeHtml } from "./email";
import { euros } from "./money";
import { getStripe, stripeEnabled } from "./stripe";

const PAID_STATES = ["PAID", "PREPARING", "SHIPPED", "DELIVERED"];

export class StockError extends Error {}

function orderNumber() {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(5);
  const suffix = [...bytes].map((b) => alphabet[b % alphabet.length]).join("");
  return `IW-${ymd}-${suffix}`;
}

export type CustomerData = {
  email: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  province: string;
  country: string;
  notes?: string;
};

/** Crea el pedido y reserva stock y puntos de forma atómica. */
export async function createPendingOrder(q: Quote, customer: CustomerData, userId: string | null) {
  return db.$transaction(async (tx) => {
    for (const l of q.lines) {
      const res = await tx.product.updateMany({
        where: { id: l.productId, active: true, stock: { gte: l.quantity } },
        data: { stock: { decrement: l.quantity } },
      });
      if (res.count !== 1) throw new StockError(`Lo sentimos, ${l.name} acaba de agotarse.`);
    }

    if (userId && q.pointsRedeemed > 0) {
      const res = await tx.user.updateMany({
        where: { id: userId, points: { gte: q.pointsRedeemed } },
        data: { points: { decrement: q.pointsRedeemed } },
      });
      if (res.count !== 1) throw new StockError("Tus puntos han cambiado; revisa el pedido.");
    }

    const order = await tx.order.create({
      data: {
        number: orderNumber(),
        accessToken: randomBytes(24).toString("base64url"),
        userId,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        city: customer.city,
        postalCode: customer.postalCode,
        province: customer.province,
        country: customer.country,
        customerNotes: customer.notes || null,
        subtotal: q.subtotal,
        welcomeDiscount: q.welcomeDiscount,
        pointsDiscount: q.pointsDiscount,
        pointsRedeemed: q.pointsRedeemed,
        shipping: q.shipping,
        total: q.total,
        pointsEarned: userId ? q.pointsToEarn : 0,
        items: {
          create: q.lines.map((l) => ({
            productId: l.productId,
            name: `${l.brand} ${l.name}`,
            reference: l.reference,
            image: l.image,
            price: l.price,
            quantity: l.quantity,
          })),
        },
        events: { create: { type: "CREATED", message: "Pedido creado, pendiente de pago" } },
      },
    });

    for (const l of q.lines) {
      const p = await tx.product.findUniqueOrThrow({ where: { id: l.productId }, select: { stock: true } });
      await tx.stockMovement.create({
        data: { productId: l.productId, change: -l.quantity, stockAfter: p.stock, reason: "SALE_RESERVED", orderId: order.id, actor: "checkout" },
      });
    }
    if (userId && q.pointsRedeemed > 0) {
      await tx.pointsTransaction.create({
        data: { userId, points: -q.pointsRedeemed, reason: `Canje en pedido ${order.number}`, orderId: order.id },
      });
    }
    return order;
  });
}

/** Marca el pedido como pagado. Idempotente: se puede llamar desde el webhook y desde la página de éxito. */
export async function markOrderPaid(orderId: string, paymentIntent?: string | null) {
  const order = await db.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) return null;
  if (PAID_STATES.includes(order.status) || order.status === "REFUNDED") return order;

  const lateAfterCancel = order.status === "CANCELLED";

  const updated = await db.$transaction(async (tx) => {
    const res = await tx.order.updateMany({
      where: { id: orderId, status: order.status },
      data: { status: "PAID", paidAt: new Date(), stripePaymentIntent: paymentIntent ?? undefined, cancelledAt: null },
    });
    if (res.count !== 1) return null; // otra petición se adelantó

    if (lateAfterCancel) {
      // La reserva había caducado: volvemos a descontar stock y lo avisamos al admin.
      for (const it of order.items) {
        if (!it.productId) continue;
        const p = await tx.product.update({ where: { id: it.productId }, data: { stock: { decrement: it.quantity } } });
        await tx.stockMovement.create({
          data: { productId: it.productId, change: -it.quantity, stockAfter: p.stock, reason: "SALE_RESERVED", orderId, actor: "pago tardío" },
        });
      }
      await tx.orderEvent.create({ data: { orderId, type: "WARNING", message: "Pago recibido después de caducar la reserva: revisa el stock." } });
    }

    await tx.orderEvent.create({ data: { orderId, type: "PAID", message: "Pago confirmado" } });

    if (order.userId) {
      await tx.user.update({
        where: { id: order.userId },
        data: {
          points: { increment: order.pointsEarned },
          ...(order.welcomeDiscount > 0 ? { welcomeDiscountUsed: true } : {}),
        },
      });
      if (order.pointsEarned > 0) {
        await tx.pointsTransaction.create({
          data: { userId: order.userId, points: order.pointsEarned, reason: `Compra ${order.number}`, orderId },
        });
      }
    }
    return tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
  });

  if (updated) {
    void sendOrderConfirmation(updated);
  }
  return updated;
}

/** Cancela un pedido devolviendo stock y puntos. Si estaba pagado y hay Stripe, reembolsa. */
export async function cancelOrder(orderId: string, opts: { reason: string; actor: string; refund?: boolean }) {
  const order = await db.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order || order.status === "CANCELLED" || order.status === "REFUNDED") return order;
  const wasPaid = PAID_STATES.includes(order.status);

  if (wasPaid && opts.refund && stripeEnabled() && order.stripePaymentIntent) {
    await getStripe().refunds.create({ payment_intent: order.stripePaymentIntent });
  }

  return db.$transaction(async (tx) => {
    const res = await tx.order.updateMany({
      where: { id: orderId, status: order.status },
      data: { status: wasPaid ? "REFUNDED" : "CANCELLED", cancelledAt: new Date() },
    });
    if (res.count !== 1) return order;

    for (const it of order.items) {
      if (!it.productId) continue;
      const p = await tx.product.update({ where: { id: it.productId }, data: { stock: { increment: it.quantity } } });
      await tx.stockMovement.create({
        data: { productId: it.productId, change: it.quantity, stockAfter: p.stock, reason: wasPaid ? "RETURN" : "RELEASED", orderId, actor: opts.actor, note: opts.reason },
      });
    }

    if (order.userId) {
      const delta = order.pointsRedeemed - (wasPaid ? order.pointsEarned : 0);
      if (delta !== 0) {
        const u = await tx.user.findUnique({ where: { id: order.userId }, select: { points: true } });
        const newPoints = Math.max(0, (u?.points ?? 0) + delta);
        await tx.user.update({ where: { id: order.userId }, data: { points: newPoints } });
        await tx.pointsTransaction.create({
          data: { userId: order.userId, points: delta, reason: `Ajuste por cancelación ${order.number}`, orderId },
        });
      }
      if (wasPaid && order.welcomeDiscount > 0) {
        await tx.user.update({ where: { id: order.userId }, data: { welcomeDiscountUsed: false } });
      }
    }
    await tx.orderEvent.create({
      data: { orderId, type: wasPaid ? "REFUNDED" : "CANCELLED", message: `${wasPaid ? "Reembolsado" : "Cancelado"}: ${opts.reason}` },
    });
    return tx.order.findUnique({ where: { id: orderId } });
  });
}

/** Libera el stock de pedidos que nunca se pagaron. */
export async function releaseExpiredReservations() {
  const limit = new Date(Date.now() - (RULES.reservationMinutes + 5) * 60_000);
  const stale = await db.order.findMany({ where: { status: "PENDING", createdAt: { lt: limit } }, select: { id: true } });
  for (const o of stale) {
    await cancelOrder(o.id, { reason: "Pago no completado a tiempo", actor: "sistema" });
  }
  return stale.length;
}

async function sendOrderConfirmation(order: { number: string; email: string; name: string; total: number; accessToken: string; items: { name: string; quantity: number; price: number }[] }) {
  const rows = order.items
    .map((i) => `<tr><td>${escapeHtml(i.name)} × ${i.quantity}</td><td style="text-align:right">${euros(i.price * i.quantity)}</td></tr>`)
    .join("");
  await sendMail({
    to: order.email,
    subject: `Pedido ${order.number} confirmado · ${SITE.name}`,
    html: `<div style="font-family:Georgia,serif;color:#1a1a1a">
      <h1 style="font-weight:400">Gracias, ${escapeHtml(order.name.split(" ")[0])}</h1>
      <p>Hemos recibido tu pago. Prepararemos tu reloj con el máximo cuidado y te avisaremos al enviarlo con su número de seguimiento.</p>
      <table width="100%">${rows}<tr><td><b>Total</b></td><td style="text-align:right"><b>${euros(order.total)}</b></td></tr></table>
      <p><a href="${SITE.url}/pedido/${order.number}?t=${order.accessToken}" style="color:#A88A4A">Ver el estado de tu pedido</a></p>
    </div>`,
  });
}

export async function notifyShipped(order: { number: string; email: string; name: string; accessToken: string; carrier: string | null; trackingNumber: string | null }) {
  await sendMail({
    to: order.email,
    subject: `Tu pedido ${order.number} está en camino`,
    html: `<div style="font-family:Georgia,serif;color:#1a1a1a">
      <h1 style="font-weight:400">Tu reloj ya está en camino</h1>
      <p>Envío asegurado con ${escapeHtml(order.carrier || "nuestra agencia")}. Seguimiento: <b>${escapeHtml(order.trackingNumber || "-")}</b></p>
      <p><a href="${SITE.url}/pedido/${order.number}?t=${order.accessToken}" style="color:#A88A4A">Ver pedido</a></p>
    </div>`,
  });
}
