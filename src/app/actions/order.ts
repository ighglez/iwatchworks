"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { getOrderForViewer } from "@/lib/order-access";
import { cancelOrder, markOrderPaid } from "@/lib/orders";
import { demoPaymentsEnabled } from "@/lib/stripe";
import { createSession, hashPassword } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function demoPay(form: FormData) {
  if (!demoPaymentsEnabled()) throw new Error("Pagos de demostración desactivados");
  const number = String(form.get("order"));
  const token = String(form.get("t"));
  const order = await getOrderForViewer(number, token);
  if (!order || order.paymentProvider !== "demo") redirect("/");
  if (form.get("result") === "cancel") {
    await cancelOrder(order.id, { reason: "Pago cancelado por el cliente", actor: "cliente" });
    redirect("/checkout?cancelado=1");
  }
  await markOrderPaid(order.id, `demo_${order.number}`);
  redirect(`/checkout/exito?order=${order.number}&t=${token}`);
}

export type ClaimState = { error?: string; ok?: boolean } | null;

/** Un cliente invitado crea su cuenta tras pagar y recibe los puntos de ese pedido. */
export async function claimOrderAccount(_: ClaimState, form: FormData): Promise<ClaimState> {
  if (!(await rateLimit(`claim:${await clientIp()}`, 5, 600))) return { error: "Demasiados intentos." };
  const password = z.string().min(8).max(200).safeParse(form.get("password"));
  if (!password.success) return { error: "La contraseña debe tener al menos 8 caracteres." };
  const order = await getOrderForViewer(String(form.get("order")), String(form.get("t")));
  if (!order || order.userId) return { error: "Este pedido ya está asociado a una cuenta." };
  if (!["PAID", "PREPARING", "SHIPPED", "DELIVERED"].includes(order.status)) return { error: "El pedido aún no está pagado." };
  if (await db.user.findUnique({ where: { email: order.email } })) {
    return { error: "Ya existe una cuenta con este email. Inicia sesión para verla." };
  }
  const points = Math.floor(order.total / 100);
  const user = await db.$transaction(async (tx) => {
    const u = await tx.user.create({
      data: {
        email: order.email,
        name: order.name,
        phone: order.phone,
        passwordHash: await hashPassword(password.data),
        address: order.address,
        city: order.city,
        postalCode: order.postalCode,
        province: order.province,
        points,
        welcomeDiscountUsed: true,
      },
    });
    await tx.order.update({ where: { id: order.id }, data: { userId: u.id, pointsEarned: points } });
    await tx.pointsTransaction.create({ data: { userId: u.id, points, reason: `Compra ${order.number}`, orderId: order.id } });
    return u;
  });
  await createSession(user.id);
  return { ok: true };
}

export async function submitReview(_: ClaimState, form: FormData): Promise<ClaimState> {
  const order = await getOrderForViewer(String(form.get("order")), String(form.get("t") || ""));
  if (!order || order.status !== "DELIVERED") return { error: "Podrás opinar cuando recibas tu pedido." };
  const rating = Number(form.get("rating"));
  const text = String(form.get("text") || "").trim();
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { error: "Elige una puntuación." };
  if (text.length < 10 || text.length > 1000) return { error: "Escribe entre 10 y 1000 caracteres." };
  if (await db.review.findUnique({ where: { orderId: order.id } })) return { error: "Ya has opinado sobre este pedido. ¡Gracias!" };
  const first = order.name.split(" ");
  await db.review.create({
    data: {
      orderId: order.id,
      name: `${first[0]} ${first[1]?.[0] ? first[1][0] + "." : ""}`.trim(),
      city: order.city,
      rating,
      text,
      product: order.items[0]?.name ?? null,
      approved: false,
    },
  });
  return { ok: true };
}
