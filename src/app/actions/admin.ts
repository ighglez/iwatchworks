"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomBytes } from "crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
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
    await db.orderEvent.create({ data: { orderId: id, type: "NOTE", message: `Pago marcado manualmente por ${admin.email}` } });
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
  await cancelOrder(id, { reason, actor: admin.email, refund: form.get("refund") === "on" });
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
