"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomBytes } from "crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import QRCode from "qrcode";
import { createSession, verifyPassword } from "@/lib/auth";
import { verifyTotp, newTotpSecret, otpauthUrl } from "@/lib/totp";
import { audit } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";
import { sendMail, escapeHtml } from "@/lib/email";
import { adminAlertEmail } from "@/lib/email-templates";
import { SITE } from "@/lib/config";
import { formatPhone, normalizePhone } from "@/lib/contact";
import { cancelOrder, markOrderPaid, notifyShipped } from "@/lib/orders";
import { centsFromEuroInput } from "@/lib/money";
import { slugify } from "@/lib/product";
import { MAX_IMAGE_BYTES, imageExt, isImageUrl } from "@/lib/uploads";

export type AdminState = { error?: string; ok?: boolean; message?: string } | null;

/* ---------- Pedidos ---------- */

const NEXT_STATUS: Record<string, string[]> = {
  PENDING: ["PAID"],
  PAID: ["PREPARING", "SHIPPED"],
  PREPARING: ["SHIPPED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
};

export async function updateOrderStatus(form: FormData) {
  const admin = await requireAdmin();
  const id = String(form.get("id"));
  const status = String(form.get("status"));
  const order = await db.order.findUnique({ where: { id } });
  if (!order || !NEXT_STATUS[order.status]?.includes(status)) return;

  if (status === "PAID") {
    // Pago confirmado manualmente (p. ej. transferencia)
    await markOrderPaid(id, null);
    await audit(admin.email, order.paymentProvider === "transfer" ? "Transferencia marcada como recibida" : "Pedido marcado como pagado", `${order.number} · ${(order.total / 100).toFixed(2)} €`);
    await db.orderEvent.create({ data: { orderId: id, type: "NOTE", message: order.paymentProvider === "transfer" ? `Transferencia recibida, confirmada por ${admin.email}` : `Pago marcado manualmente por ${admin.email}` } });
  } else if (status === "SHIPPED") {
    const carrier = z.string().trim().min(2).max(60).safeParse(form.get("carrier"));
    const tracking = z.string().trim().min(3).max(80).safeParse(form.get("tracking"));
    if (!carrier.success || !tracking.success) return;
    const updated = await db.order.update({
      where: { id },
      data: { status, shippedAt: new Date(), carrier: carrier.data, trackingNumber: tracking.data, events: { create: { type: status, message: `Enviado con ${carrier.data} · ${tracking.data}` } } },
    });
    void notifyShipped(updated);
  } else {
    await db.order.update({
      where: { id },
      data: {
        status,
        ...(status === "DELIVERED" ? { deliveredAt: new Date() } : {}),
        events: { create: { type: status, message: status === "PREPARING" ? "En preparación" : "Entregado" } },
      },
    });
  }
  revalidatePath(`/admin/pedidos/${id}`);
}

export async function adminCancelOrder(form: FormData) {
  const admin = await requireAdmin();
  const id = String(form.get("id"));
  const reason = String(form.get("reason") || "Cancelado por la tienda").slice(0, 200);
  const o = await cancelOrder(id, { reason, actor: admin.email, refund: form.get("refund") === "on", notify: "store" });
  await audit(admin.email, "Pedido cancelado", `${o?.number ?? id} · ${reason}`);
  revalidatePath(`/admin/pedidos/${id}`);
}

export async function saveAdminNotes(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id"));
  await db.order.update({ where: { id }, data: { adminNotes: String(form.get("notes") || "").slice(0, 2000) } });
  revalidatePath(`/admin/pedidos/${id}`);
}

/* ---------- Productos ---------- */

const productSchema = z.object({
  name: z.string().trim().min(2, "Nombre obligatorio").max(120),
  brand: z.string().trim().min(1, "Marca obligatoria").max(60),
  reference: z.string().trim().min(1, "Referencia obligatoria").max(60),
  category: z.string().trim().min(1, "Categoría obligatoria").max(60),
  description: z.string().trim().min(10, "Añade una descripción").max(5000),
  lowStockThreshold: z.coerce.number().int().min(0).max(100),
  featured: z.boolean(),
  active: z.boolean(),
});

/** Sube una foto (ya reducida en el navegador) y devuelve su URL. Se guarda en la base de datos. */
export async function uploadProductImage(form: FormData): Promise<{ url?: string; error?: string }> {
  await requireAdmin();
  const f = form.get("file");
  if (!(f instanceof File) || f.size === 0) return { error: "No se ha recibido ninguna imagen." };
  if (f.size > MAX_IMAGE_BYTES) return { error: "La imagen es demasiado grande (máximo 3 MB)." };
  const buf = Buffer.from(await f.arrayBuffer());
  const ext = imageExt(buf);
  if (!ext) return { error: "El archivo no es una imagen JPG, PNG, WEBP o AVIF válida." };
  const mime = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", avif: "image/avif" }[ext]!;
  const up = await db.upload.create({ data: { mime, size: buf.length, data: buf } });
  return { url: `/uploads/${up.id}.${ext}` };
}

function parseSpecs(text: string) {
  const specs: Record<string, string> = {};
  for (const line of text.split("\n")) {
    const i = line.indexOf(":");
    if (i > 0) specs[line.slice(0, i).trim().slice(0, 60)] = line.slice(i + 1).trim().slice(0, 200);
  }
  return specs;
}

function parseImageUrls(text: string) {
  return [...new Set(text.split("\n").map((s) => s.trim()).filter(isImageUrl))].slice(0, 12);
}

export async function saveProduct(_: AdminState, form: FormData): Promise<AdminState> {
  const admin = await requireAdmin();
  const id = form.get("id") ? String(form.get("id")) : null;
  const parsed = productSchema.safeParse({
    name: form.get("name"),
    brand: form.get("brand"),
    reference: form.get("reference"),
    category: form.get("category"),
    description: form.get("description"),
    lowStockThreshold: form.get("lowStockThreshold") || 2,
    featured: form.get("featured") === "on",
    active: form.get("active") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const price = centsFromEuroInput(String(form.get("price") || ""));
  if (!price || price < 100) return { error: "Indica un precio válido." };
  const compareRaw = String(form.get("compareAtPrice") || "").trim();
  const compareAtPrice = compareRaw ? centsFromEuroInput(compareRaw) : null;

  const images = parseImageUrls(String(form.get("images") || ""));
  const specs = parseSpecs(String(form.get("specs") || ""));
  const data = { ...parsed.data, price, compareAtPrice, images: JSON.stringify(images), specs: JSON.stringify(specs) };

  if (id) {
    await db.product.update({ where: { id }, data });
  } else {
    const initialStock = Math.max(0, Math.min(10000, Number(form.get("stock") || 0) | 0));
    let slug = slugify(`${data.brand} ${data.name} ${data.reference}`);
    if (await db.product.findUnique({ where: { slug } })) slug = `${slug}-${randomBytes(2).toString("hex")}`;
    const p = await db.product.create({ data: { ...data, slug, stock: initialStock } });
    if (initialStock > 0) {
      await db.stockMovement.create({ data: { productId: p.id, change: initialStock, stockAfter: initialStock, reason: "RESTOCK", note: "Stock inicial", actor: admin.email } });
    }
    redirect(`/admin/productos/${p.id}?creado=1`);
  }
  revalidatePath("/admin/productos");
  return { ok: true, message: "Producto guardado." };
}

export async function toggleProduct(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id"));
  const p = await db.product.findUnique({ where: { id } });
  if (p) await db.product.update({ where: { id }, data: { active: !p.active } });
  revalidatePath("/admin/productos");
}

/* ---------- Inventario ---------- */

export async function adjustStock(_: AdminState, form: FormData): Promise<AdminState> {
  const admin = await requireAdmin();
  const id = String(form.get("productId"));
  const mode = String(form.get("mode")); // add | set
  const qty = Number(form.get("qty"));
  const reason = String(form.get("reason") || "ADJUSTMENT");
  const note = String(form.get("note") || "").slice(0, 200) || null;
  if (!Number.isInteger(qty) || Math.abs(qty) > 10000) return { error: "Cantidad no válida." };
  if (!["RESTOCK", "ADJUSTMENT", "RETURN"].includes(reason)) return { error: "Motivo no válido." };

  const result = await db.$transaction(async (tx) => {
    const p = await tx.product.findUnique({ where: { id } });
    if (!p) return null;
    const change = mode === "set" ? qty - p.stock : qty;
    if (p.stock + change < 0) return "negative";
    const updated = await tx.product.update({ where: { id }, data: { stock: { increment: change } } });
    await tx.stockMovement.create({ data: { productId: id, change, stockAfter: updated.stock, reason, note, actor: admin.email } });
    return updated;
  });
  if (result === "negative") return { error: "El stock no puede quedar en negativo." };
  if (!result) return { error: "Producto no encontrado." };
  revalidatePath("/admin/inventario");
  revalidatePath("/admin/productos");
  return { ok: true, message: `Stock de ${result.name}: ${result.stock} uds.` };
}

/* ---------- Clientes ---------- */

export async function adjustPoints(form: FormData) {
  const admin = await requireAdmin();
  const userId = String(form.get("userId"));
  const points = Number(form.get("points"));
  if (!Number.isInteger(points) || points === 0 || Math.abs(points) > 100000) return;
  await db.$transaction(async (tx) => {
    const u = await tx.user.findUnique({ where: { id: userId } });
    if (!u) return;
    await tx.user.update({ where: { id: userId }, data: { points: Math.max(0, u.points + points) } });
    await tx.pointsTransaction.create({ data: { userId, points, reason: `Ajuste manual (${admin.email})` } });
  });
  revalidatePath("/admin/clientes");
}

/* ---------- Mensajes y reseñas ---------- */

export async function markMessageRead(form: FormData) {
  await requireAdmin();
  await db.contactMessage.update({ where: { id: String(form.get("id")) }, data: { read: true } });
  revalidatePath("/admin/mensajes");
}

export async function moderateReview(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id"));
  const op = String(form.get("op"));
  if (op === "delete") await db.review.delete({ where: { id } });
  else await db.review.update({ where: { id }, data: { approved: op === "approve" } });
  revalidatePath("/admin/resenas");
  revalidatePath("/");
}

/* ---------- Ajustes ---------- */

/** Valida un IBAN con el dígito de control (ISO 13616). */
function validIban(raw: string) {
  const iban = raw.replace(/\s+/g, "").toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(iban)) return null;
  const rearranged = (iban.slice(4) + iban.slice(0, 4)).replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  let rem = 0;
  for (const d of rearranged) rem = (rem * 10 + Number(d)) % 97;
  return rem === 1 ? iban : null;
}

/** Confirma la identidad antes de una acción sensible: contraseña y, si está activa, código 2FA. */
async function confirmIdentity(admin: { id: string; email: string; passwordHash: string; totpSecret: string | null; totpLastStep: number | null }, form: FormData) {
  if (!(await rateLimit(`sensitive:${admin.id}`, 8, 900))) return "Demasiados intentos. Espera 15 minutos.";
  if (!(await verifyPassword(String(form.get("password") || ""), admin.passwordHash))) return "La contraseña no es correcta.";
  if (admin.totpSecret) {
    const step = verifyTotp(admin.totpSecret, String(form.get("code") || ""), admin.totpLastStep);
    if (step == null) return "El código de verificación no es correcto.";
    await db.user.update({ where: { id: admin.id }, data: { totpLastStep: step } });
  }
  return null;
}

export async function saveBankDetails(_: AdminState, form: FormData): Promise<AdminState> {
  const admin = await requireAdmin();
  const holder = String(form.get("holder") || "").trim().slice(0, 120);
  const iban = validIban(String(form.get("iban") || ""));
  const bic = String(form.get("bic") || "").trim().toUpperCase().slice(0, 11);
  const bank = String(form.get("bank") || "").trim().slice(0, 80);
  if (holder.length < 3) return { error: "Indica el titular de la cuenta." };
  if (!iban) return { error: "El IBAN no es válido. Revisa que esté completo y sin errores." };
  if (bic && !/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(bic)) return { error: "El BIC/SWIFT no es válido." };
  const denied = await confirmIdentity(admin, form);
  if (denied) {
    await audit(admin.email, "Cambio de datos bancarios rechazado", denied);
    return { error: denied };
  }
  const prev = await db.siteMeta.findUnique({ where: { key: "bank" } });
  const prevIban = prev ? (JSON.parse(prev.value).iban as string | undefined) : undefined;
  const value = JSON.stringify({ holder, iban, bic, bank, updatedBy: admin.email, updatedAt: new Date().toISOString() });
  await db.siteMeta.upsert({ where: { key: "bank" }, create: { key: "bank", value }, update: { value } });
  const mask = (x?: string) => (x ? `${x.slice(0, 4)} •••• ${x.slice(-4)}` : "(ninguno)");
  await audit(admin.email, "Datos bancarios cambiados", `IBAN ${mask(prevIban)} → ${mask(iban)} · Titular: ${holder}`);
  // Aviso por email: si alguien cambia la cuenta sin permiso, lo sabrás al momento.
  const to = [...new Set([admin.email, SITE.email])];
  for (const t of to) {
    await sendMail({
      to: t,
      ...adminAlertEmail(
        "Datos bancarios cambiados",
        `Se han cambiado los datos bancarios de la tienda desde el panel (${escapeHtml(admin.email)}).<br><br>IBAN nuevo: <b>${escapeHtml(mask(iban))}</b><br>Titular: <b>${escapeHtml(holder)}</b><br><br>Si no has sido tú, entra en el panel, corrige los datos y cambia tu contraseña de inmediato.`,
      ),
    });
  }
  revalidatePath("/admin");
  return { ok: true, message: "Datos bancarios guardados. Ya aparecen en los nuevos pedidos." };
}

export async function saveWhatsapp(_: AdminState, form: FormData): Promise<AdminState> {
  const admin = await requireAdmin();
  const number = normalizePhone(String(form.get("whatsapp") || ""));
  if (!number) return { error: "Escribe un móvil válido, por ejemplo +34 612 345 678." };
  await db.siteMeta.upsert({
    where: { key: "whatsapp" },
    create: { key: "whatsapp", value: JSON.stringify({ number }) },
    update: { value: JSON.stringify({ number }) },
  });
  await audit(admin.email, "Número de WhatsApp cambiado", formatPhone(number));
  revalidatePath("/", "layout");
  return { ok: true, message: `Guardado. Los botones de WhatsApp ya abren ${formatPhone(number)}.` };
}

export async function sendTestEmail(_: AdminState, form: FormData): Promise<AdminState> {
  const admin = await requireAdmin();
  if (!(await rateLimit(`testmail:${admin.id}`, 10, 3600))) return { error: "Has enviado muchas pruebas seguidas. Espera un rato." };
  const { EMAIL_KINDS, sampleEmail } = await import("@/lib/email-samples");
  const kind = EMAIL_KINDS.find(([k]) => k === form.get("kind"))?.[0] ?? "bienvenida";
  const res = await sendMail({ to: admin.email, ...(await sampleEmail(kind)) });
  return res.ok ? { ok: true, message: `Enviado a ${admin.email}. Revisa también la carpeta de spam.` } : { error: res.error };
}

/* ---------- Verificación en dos pasos ---------- */

export async function startTwoFactor(): Promise<{ secret?: string; qr?: string; error?: string }> {
  const admin = await requireAdmin();
  if (admin.totpSecret) return { error: "La verificación en dos pasos ya está activa." };
  const secret = newTotpSecret();
  await db.user.update({ where: { id: admin.id }, data: { totpPendingSecret: secret } });
  const qr = await QRCode.toDataURL(otpauthUrl(secret, admin.email), { margin: 1, width: 220, color: { dark: "#141413", light: "#ffffff" } });
  return { secret, qr };
}

export async function enableTwoFactor(_: AdminState, form: FormData): Promise<AdminState> {
  const admin = await requireAdmin();
  if (!(await rateLimit(`2fa:${admin.id}`, 8, 900))) return { error: "Demasiados intentos. Espera 15 minutos." };
  if (!admin.totpPendingSecret) return { error: "Vuelve a pulsar «Activar» para generar un código nuevo." };
  const step = verifyTotp(admin.totpPendingSecret, String(form.get("code") || ""));
  if (step == null) return { error: "El código no coincide. Comprueba que la hora del móvil es correcta y prueba con el código actual." };
  await db.user.update({ where: { id: admin.id }, data: { totpSecret: admin.totpPendingSecret, totpPendingSecret: null, totpLastStep: step } });
  // Cierra el resto de sesiones del administrador
  await db.session.deleteMany({ where: { userId: admin.id } });
  await createSession(admin.id);
  await audit(admin.email, "Verificación en dos pasos activada");
  revalidatePath("/admin/ajustes");
  return { ok: true, message: "Verificación en dos pasos activada. A partir de ahora te pediremos el código al entrar." };
}

export async function disableTwoFactor(_: AdminState, form: FormData): Promise<AdminState> {
  const admin = await requireAdmin();
  const denied = await confirmIdentity(admin, form);
  if (denied) return { error: denied };
  await db.user.update({ where: { id: admin.id }, data: { totpSecret: null, totpPendingSecret: null, totpLastStep: null } });
  await audit(admin.email, "Verificación en dos pasos desactivada");
  revalidatePath("/admin/ajustes");
  return { ok: true, message: "Verificación en dos pasos desactivada." };
}
