"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { centsFromEuroInput } from "@/lib/money";
import { normalizeCode, codeLabel } from "@/lib/discounts";
import type { AdminState } from "./admin";

/** "2026-12-31" + hora → fecha real en horario de Madrid. */
function madrid(date: string, time: string) {
  const guess = new Date(`${date}T${time}Z`);
  const off = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Madrid", timeZoneName: "shortOffset" })
    .formatToParts(guess).find((p) => p.type === "timeZoneName")?.value.match(/GMT([+-]\d+)?/)?.[1];
  return new Date(guess.getTime() - Number(off ?? 0) * 3600_000);
}

const dateField = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("").transform(() => undefined));

const schema = z.object({
  code: z.string().regex(/^[A-Z0-9_-]{3,30}$/, "El código debe tener entre 3 y 30 letras o números, sin espacios."),
  description: z.string().trim().max(120).optional(),
  kind: z.enum(["PERCENT", "AMOUNT"]),
  value: z.string(),
  minSubtotal: z.string().optional(),
  maxUses: z.string().optional(),
  onePerCustomer: z.boolean(),
  startsAt: dateField,
  expiresAt: dateField,
});

export async function createDiscountCode(_: AdminState, form: FormData): Promise<AdminState> {
  const admin = await requireAdmin();
  const parsed = schema.safeParse({
    code: normalizeCode(form.get("code")),
    description: String(form.get("description") || "") || undefined,
    kind: form.get("kind"),
    value: String(form.get("value") || ""),
    minSubtotal: String(form.get("minSubtotal") || ""),
    maxUses: String(form.get("maxUses") || ""),
    onePerCustomer: form.get("onePerCustomer") === "on",
    startsAt: String(form.get("startsAt") || ""),
    expiresAt: String(form.get("expiresAt") || ""),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  let value: number | null;
  if (d.kind === "PERCENT") {
    const n = Number(d.value.replace(",", "."));
    value = Number.isInteger(n) && n >= 1 && n <= 90 ? n : null;
    if (value == null) return { error: "El porcentaje debe ser un número entero entre 1 y 90." };
  } else {
    value = centsFromEuroInput(d.value);
    if (!value || value < 100) return { error: "El importe mínimo del descuento es 1 €." };
  }
  const minSubtotal = d.minSubtotal ? centsFromEuroInput(d.minSubtotal) : 0;
  if (minSubtotal == null) return { error: "La compra mínima no es un importe válido." };
  const maxUses = d.maxUses ? Number(d.maxUses) : null;
  if (maxUses != null && (!Number.isInteger(maxUses) || maxUses < 1)) return { error: "El número de usos debe ser un entero mayor que 0." };

  const startsAt = d.startsAt ? madrid(d.startsAt, "00:00:00") : null;
  const expiresAt = d.expiresAt ? madrid(d.expiresAt, "23:59:59") : null;
  if (startsAt && expiresAt && expiresAt <= startsAt) return { error: "La fecha de fin debe ser posterior a la de inicio." };

  if (await db.discountCode.findUnique({ where: { code: d.code } })) return { error: `Ya existe el código ${d.code}.` };

  await db.discountCode.create({
    data: { code: d.code, description: d.description, kind: d.kind, value, minSubtotal, maxUses, onePerCustomer: d.onePerCustomer, startsAt, expiresAt },
  });
  await audit(admin.email, "Código de descuento creado", `${d.code} · ${codeLabel({ kind: d.kind, value })}`);
  revalidatePath("/admin/descuentos");
  return { ok: true, message: `Código ${d.code} creado. Ya funciona en la tienda.` };
}

export async function toggleDiscountCode(form: FormData) {
  const admin = await requireAdmin();
  const c = await db.discountCode.findUnique({ where: { id: String(form.get("id")) } });
  if (!c) return;
  await db.discountCode.update({ where: { id: c.id }, data: { active: !c.active } });
  await audit(admin.email, c.active ? "Código de descuento desactivado" : "Código de descuento activado", c.code);
  revalidatePath("/admin/descuentos");
}

export async function deleteDiscountCode(form: FormData) {
  const admin = await requireAdmin();
  const c = await db.discountCode.findUnique({ where: { id: String(form.get("id")) } });
  if (!c) return;
  const used = await db.order.count({ where: { discountCode: c.code } });
  if (used > 0) {
    // Se conserva para que los pedidos antiguos sigan cuadrando; solo se desactiva.
    await db.discountCode.update({ where: { id: c.id }, data: { active: false } });
  } else {
    await db.discountCode.delete({ where: { id: c.id } });
  }
  await audit(admin.email, "Código de descuento eliminado", c.code);
  revalidatePath("/admin/descuentos");
}
