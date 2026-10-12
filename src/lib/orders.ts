import "server-only";
import { randomBytes } from "crypto";
import { db } from "./db";
import { RULES, SITE } from "./config";
import type { Quote } from "./pricing";
import { sendMail } from "./email";
import { cancelledEmail, paidEmail, shippedEmail, transferEmail } from "./email-templates";
import { euros } from "./money";
import { getStripe, stripeEnabled } from "./stripe";
import { formatIban, getBankDetails, transferDeadline } from "./payments";

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

    if (q.discountCode) {
      const dc = tx.discountCode.fields;
      const res = await tx.discountCode.updateMany({
        where: { code: q.discountCode, active: true, OR: [{ maxUses: null }, { uses: { lt: dc.maxUses } }] },
        data: { uses: { increment: 1 } },
      });
      if (res.count !== 1) throw new StockError("El código de descuento se acaba de agotar; quítalo y vuelve a confirmar.");
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
        discountCode: q.discountCode,
        codeDiscount: q.codeDiscount,
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
export async function cancelOrder(orderId: string, opts: { reason: string; actor: string; refund?: boolean; notify?: "expired" | "store" }) {
  const order = await db.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order || order.status === "CANCELLED" || order.status === "REFUNDED") return order;
  const wasPaid = PAID_STATES.includes(order.status);

  if (wasPaid && opts.refund && stripeEnabled() && order.stripePaymentIntent) {
    await getStripe().refunds.create({ payment_intent: order.stripePaymentIntent });
  }

  let changed = false;
  const result = await db.$transaction(async (tx) => {
    const res = await tx.order.updateMany({
      where: { id: orderId, status: order.status },
      data: { status: wasPaid ? "REFUNDED" : "CANCELLED", cancelledAt: new Date() },
    });
    if (res.count !== 1) return order;
    changed = true;

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
    if (order.discountCode) {
      await tx.discountCode.updateMany({ where: { code: order.discountCode, uses: { gt: 0 } }, data: { uses: { decrement: 1 } } });
    }
    await tx.orderEvent.create({
      data: { orderId, type: wasPaid ? "REFUNDED" : "CANCELLED", message: `${wasPaid ? "Reembolsado" : "Cancelado"}: ${opts.reason}` },
    });
    return tx.order.findUnique({ where: { id: orderId } });
  });
  if (changed && opts.notify) void sendMail({ to: order.email, ...cancelledEmail(order, opts.notify) });
  return result;
}

/** Libera el stock de pedidos que nunca se pagaron (tarjeta: minutos; transferencia: días). */
export async function releaseExpiredReservations() {
  const cardLimit = new Date(Date.now() - (RULES.reservationMinutes + 5) * 60_000);
  const transferLimit = new Date(Date.now() - RULES.transferDays * 86_400_000);
  const stale = await db.order.findMany({
    where: {
      status: "PENDING",
      OR: [
        { paymentProvider: { not: "transfer" }, createdAt: { lt: cardLimit } },
        { paymentProvider: "transfer", createdAt: { lt: transferLimit } },
      ],
    },
    select: { id: true, paymentProvider: true },
  });
  for (const o of stale) {
    const reason = o.paymentProvider === "transfer" ? `Transferencia no recibida en ${RULES.transferDays} días` : "Pago no completado a tiempo";
    await cancelOrder(o.id, { reason, actor: "sistema", notify: o.paymentProvider === "transfer" ? "expired" : undefined });
  }
  return stale.length;
}

/** Email con los datos para hacer la transferencia. */
export async function sendTransferInstructions(orderId: string) {
  const order = await db.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) return;
  const bank = await getBankDetails();
  const deadline = transferDeadline(order.createdAt).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Madrid" });
  await sendMail({ to: order.email, ...transferEmail(order, { ...bank, iban: formatIban(bank.iban) }, deadline) });
}

async function sendOrderConfirmation(order: Parameters<typeof paidEmail>[0]) {
  await sendMail({ to: order.email, ...paidEmail(order) });
}

export async function notifyShipped(order: { number: string; email: string; name: string; accessToken: string; carrier: string | null; trackingNumber: string | null }) {
  await sendMail({ to: order.email, ...shippedEmail(order) });
}
