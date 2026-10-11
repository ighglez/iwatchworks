import "server-only";
import { db } from "./db";
import { euros } from "./money";

export type DiscountCodeRow = {
  id: string;
  code: string;
  kind: string;
  value: number;
  minSubtotal: number;
  maxUses: number | null;
  uses: number;
  onePerCustomer: boolean;
  startsAt: Date | null;
  expiresAt: Date | null;
  active: boolean;
};

export const normalizeCode = (raw: unknown) =>
  String(raw ?? "").trim().toUpperCase().replace(/\s+/g, "").slice(0, 30);

export const codeLabel = (c: Pick<DiscountCodeRow, "kind" | "value">) =>
  c.kind === "PERCENT" ? `${c.value}%` : euros(c.value);

export function codeAmount(c: Pick<DiscountCodeRow, "kind" | "value">, subtotal: number) {
  const raw = c.kind === "PERCENT" ? Math.round((subtotal * c.value) / 100) : c.value;
  return Math.max(0, Math.min(subtotal, raw));
}

/**
 * Comprueba si un código se puede usar en este pedido.
 * `email` puede faltar mientras el cliente aún no lo ha escrito; se vuelve a comprobar al confirmar.
 */
export async function checkCode(
  rawCode: unknown,
  { subtotal, email }: { subtotal: number; email?: string | null },
): Promise<{ code: DiscountCodeRow; amount: number; error?: undefined } | { error: string; code?: undefined; amount?: undefined }> {
  const value = normalizeCode(rawCode);
  if (!value) return { error: "Escribe un código." };
  const c = await db.discountCode.findUnique({ where: { code: value } });
  const now = new Date();
  if (!c || !c.active) return { error: "Este código no existe o ya no está activo." };
  if (c.startsAt && c.startsAt > now) return { error: "Este código todavía no está disponible." };
  if (c.expiresAt && c.expiresAt < now) return { error: "Este código ha caducado." };
  if (c.maxUses != null && c.uses >= c.maxUses) return { error: "Este código ya se ha agotado." };
  if (subtotal < c.minSubtotal) return { error: `Este código es para compras desde ${euros(c.minSubtotal)}.` };
  if (c.onePerCustomer && email) {
    const used = await db.order.count({
      where: { discountCode: c.code, email: email.toLowerCase(), status: { notIn: ["CANCELLED", "REFUNDED"] } },
    });
    if (used > 0) return { error: "Ya has usado este código en otro pedido." };
  }
  return { code: c, amount: codeAmount(c, subtotal) };
}
