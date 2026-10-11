"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { quote } from "@/lib/pricing";
import { createSession, getCurrentUser, hashPassword } from "@/lib/auth";
import { createPendingOrder, releaseExpiredReservations, StockError, cancelOrder, sendTransferInstructions } from "@/lib/orders";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { getStripe } from "@/lib/stripe";
import { paymentMethod } from "@/lib/payments";
import { RULES, SITE } from "@/lib/config";

export type CheckoutState = { error?: string; fieldErrors?: Record<string, string> } | null;

const itemsSchema = z.array(z.object({ productId: z.string().max(40), quantity: z.number().int().min(1).max(RULES.maxQtyPerItem) })).min(1).max(30);

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Email no válido").max(200),
  name: z.string().trim().min(3, "Indica nombre y apellidos").max(120),
  phone: z.string().trim().regex(/^[+\d][\d\s-]{7,18}$/, "Teléfono no válido"),
  address: z.string().trim().min(5, "Indica la dirección completa").max(200),
  postalCode: z.string().trim().regex(/^\d{5}$/, "Código postal de 5 cifras"),
  city: z.string().trim().min(2, "Indica la ciudad").max(80),
  province: z.string().trim().min(2, "Indica la provincia").max(80),
  notes: z.string().trim().max(500).optional(),
  createAccount: z.boolean(),
  password: z.string().max(200).optional(),
  usePoints: z.boolean(),
  code: z.string().trim().max(40).optional(),
  saveAddress: z.boolean(),
  terms: z.literal(true, { errorMap: () => ({ message: "Debes aceptar las condiciones de venta" }) }),
});

export async function placeOrder(_: CheckoutState, form: FormData): Promise<CheckoutState> {
  if (!(await rateLimit(`checkout:${await clientIp()}`, 12, 600))) {
    return { error: "Demasiados intentos seguidos. Espera unos minutos e inténtalo de nuevo." };
  }

  let items: unknown;
  try {
    items = JSON.parse(String(form.get("items") || "[]"));
  } catch {
    return { error: "Tu carrito no es válido. Recarga la página." };
  }
  const parsedItems = itemsSchema.safeParse(items);
  if (!parsedItems.success) return { error: "Tu carrito está vacío." };

  const parsed = schema.safeParse({
    email: form.get("email"),
    name: form.get("name"),
    phone: form.get("phone"),
    address: form.get("address"),
    postalCode: form.get("postalCode"),
    city: form.get("city"),
    province: form.get("province"),
    notes: form.get("notes") || undefined,
    createAccount: form.get("createAccount") === "on",
    password: form.get("password") || undefined,
    usePoints: form.get("usePoints") === "on",
    code: String(form.get("code") || "") || undefined,
    saveAddress: form.get("saveAddress") === "on",
    terms: form.get("terms") === "on",
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { error: "Revisa los campos marcados.", fieldErrors };
  }
  const d = parsed.data;

  let user = await getCurrentUser();

  if (!user && d.createAccount) {
    if (!d.password || d.password.length < 8) {
      return { error: "Revisa los campos marcados.", fieldErrors: { password: "Mínimo 8 caracteres" } };
    }
    const exists = await db.user.findUnique({ where: { email: d.email } });
    if (exists) {
      return { error: "Ya tienes una cuenta con este email. Inicia sesión para aplicar tus ventajas, o desmarca la opción para comprar como invitado.", fieldErrors: { email: "Email ya registrado" } };
    }
    user = await db.user.create({
      data: {
        email: d.email,
        name: d.name,
        phone: d.phone,
        passwordHash: await hashPassword(d.password),
        address: d.address,
        city: d.city,
        postalCode: d.postalCode,
        province: d.province,
      },
    });
    await createSession(user.id);
  } else if (user && d.saveAddress) {
    await db.user.update({
      where: { id: user.id },
      data: { phone: d.phone, address: d.address, city: d.city, postalCode: d.postalCode, province: d.province },
    });
  }

  await releaseExpiredReservations();

  const q = await quote(parsedItems.data, { userId: user?.id, usePoints: d.usePoints, code: d.code, email: user?.email ?? d.email });
  if (q.lines.length === 0) return { error: q.issues[0] ?? "Los productos de tu carrito ya no están disponibles." };
  if (d.code && q.codeError) return { error: `Código ${d.code.toUpperCase()}: ${q.codeError} Quítalo o cámbialo y vuelve a confirmar.` };
  if (q.issues.length) return { error: `${q.issues.join(" ")} Revisa el resumen y vuelve a confirmar.` };

  let order;
  try {
    order = await createPendingOrder(
      q,
      { email: user?.email ?? d.email, name: d.name, phone: d.phone, address: d.address, city: d.city, postalCode: d.postalCode, province: d.province, country: "ES", notes: d.notes },
      user?.id ?? null,
    );
  } catch (e) {
    if (e instanceof StockError) return { error: e.message };
    throw e;
  }

  const method = paymentMethod();

  if (method === "transfer") {
    await db.order.update({
      where: { id: order.id },
      data: { paymentProvider: "transfer", events: { create: { type: "NOTE", message: "Pago por transferencia bancaria: esperando el ingreso" } } },
    });
    await sendTransferInstructions(order.id);
    redirect(`/checkout/exito?order=${order.number}&t=${order.accessToken}`);
  }

  if (method === "stripe") {
    let stripeUrl: string;
    try {
      const discount = q.welcomeDiscount + q.codeDiscount + q.pointsDiscount;
      const stripe = getStripe();
      const coupon = discount > 0
        ? await stripe.coupons.create({ amount_off: discount, currency: "eur", duration: "once", name: [q.welcomeDiscount && "Bienvenida 5%", q.discountCode && `Código ${q.discountCode}`, q.pointsDiscount && "Puntos"].filter(Boolean).join(" + "), max_redemptions: 1 })
        : null;
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        locale: "es",
        customer_email: order.email,
        client_reference_id: order.id,
        metadata: { orderId: order.id, orderNumber: order.number },
        payment_intent_data: { metadata: { orderId: order.id, orderNumber: order.number } },
        line_items: q.lines.map((l) => ({
          quantity: l.quantity,
          price_data: {
            currency: "eur",
            unit_amount: l.price,
            product_data: { name: `${l.brand} ${l.name}`, description: `Ref. ${l.reference}`, images: l.image ? [l.image] : undefined },
          },
        })),
        discounts: coupon ? [{ coupon: coupon.id }] : undefined,
        expires_at: Math.floor(Date.now() / 1000) + RULES.reservationMinutes * 60 + 60,
        success_url: `${SITE.url}/checkout/exito?order=${order.number}&t=${order.accessToken}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${SITE.url}/checkout/cancelado?order=${order.number}&t=${order.accessToken}`,
      });
      await db.order.update({ where: { id: order.id }, data: { stripeSessionId: session.id } });
      stripeUrl = session.url!;
    } catch (e) {
      console.error("[checkout] stripe", e);
      await cancelOrder(order.id, { reason: "Error al iniciar el pago", actor: "sistema" });
      return { error: "No hemos podido conectar con la pasarela de pago. No se ha realizado ningún cargo; inténtalo de nuevo." };
    }
    redirect(stripeUrl);
  }

  if (method === "demo") {
    await db.order.update({ where: { id: order.id }, data: { paymentProvider: "demo" } });
    redirect(`/checkout/demo?order=${order.number}&t=${order.accessToken}`);
  }

  await cancelOrder(order.id, { reason: "Pasarela no configurada", actor: "sistema" });
  return { error: "Los pagos no están disponibles en este momento. Contáctanos y te ayudamos." };
}
