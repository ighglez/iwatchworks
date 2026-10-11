import "server-only";
import { db } from "./db";
import { RULES } from "./config";
import { parseImages } from "./product";
import { welcomeEligible } from "./auth";
import { checkCode, codeLabel } from "./discounts";

export type CartInput = { productId: string; quantity: number }[];

export type QuoteLine = {
  productId: string;
  slug: string;
  name: string;
  brand: string;
  reference: string;
  image: string | null;
  art: string;
  price: number;
  quantity: number;
  stock: number;
  lineTotal: number;
};

export type Quote = {
  lines: QuoteLine[];
  issues: string[];
  subtotal: number;
  welcomeDiscount: number;
  welcomeEligible: boolean;
  /** Código de descuento aplicado (normalizado) y su importe. */
  discountCode: string | null;
  discountLabel: string | null;
  codeDiscount: number;
  /** Motivo por el que el código escrito no se ha aplicado. */
  codeError: string | null;
  /** El código sustituye al 5% de bienvenida (no se suman); el 5% queda para otra compra. */
  welcomeReplaced: boolean;
  pointsAvailable: number;
  pointsMaxRedeemable: number;
  pointsRedeemed: number;
  pointsDiscount: number;
  shipping: number;
  total: number;
  pointsToEarn: number;
};

export function normalizeCart(items: CartInput): CartInput {
  const merged = new Map<string, number>();
  for (const it of items) {
    if (typeof it.productId !== "string" || !Number.isFinite(it.quantity)) continue;
    const q = Math.max(0, Math.min(RULES.maxQtyPerItem, Math.floor(it.quantity)));
    merged.set(it.productId, Math.min(RULES.maxQtyPerItem, (merged.get(it.productId) || 0) + q));
  }
  return [...merged.entries()].filter(([, q]) => q > 0).map(([productId, quantity]) => ({ productId, quantity }));
}

export function pointsValue(points: number) {
  return Math.floor(points / RULES.pointsBlock) * RULES.pointsBlockValueCents;
}

/**
 * Calcula el pedido SIEMPRE en el servidor con precios y stock de la base de datos.
 * `welcome`: forzar el 5% (p. ej. el cliente crea cuenta en el checkout).
 */
export async function quote(
  rawItems: CartInput,
  opts: { userId?: string | null; usePoints?: boolean; welcome?: boolean; code?: string | null; email?: string | null } = {},
): Promise<Quote> {
  const items = normalizeCart(rawItems).slice(0, 30);
  const products = await db.product.findMany({
    where: { id: { in: items.map((i) => i.productId) }, active: true },
  });
  const issues: string[] = [];
  const lines: QuoteLine[] = [];
  for (const it of items) {
    const p = products.find((x) => x.id === it.productId);
    if (!p) {
      issues.push("Un producto de tu carrito ya no está disponible y se ha retirado.");
      continue;
    }
    let quantity = it.quantity;
    if (p.stock <= 0) {
      issues.push(`${p.name} se ha agotado.`);
      continue;
    }
    if (quantity > p.stock) {
      quantity = p.stock;
      issues.push(`Solo quedan ${p.stock} unidades de ${p.name}; hemos ajustado la cantidad.`);
    }
    lines.push({
      productId: p.id,
      slug: p.slug,
      name: p.name,
      brand: p.brand,
      reference: p.reference,
      image: parseImages(p.images)[0] ?? null,
      art: p.artwork,
      price: p.price,
      quantity,
      stock: p.stock,
      lineTotal: p.price * quantity,
    });
  }

  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);

  let eligible = false;
  let pointsAvailable = 0;
  let email = opts.email ?? null;
  if (opts.userId) {
    eligible = await welcomeEligible(opts.userId);
    const u = await db.user.findUnique({ where: { id: opts.userId }, select: { points: true, email: true } });
    pointsAvailable = u?.points ?? 0;
    email = u?.email ?? email;
  } else if (opts.welcome) {
    eligible = true;
  }
  let welcomeDiscount = eligible ? Math.round((subtotal * RULES.welcomeDiscountPercent) / 100) : 0;

  // Código de descuento: no se suma al 5% de bienvenida, se aplica el mayor de los dos.
  let codeDiscount = 0;
  let discountCode: string | null = null;
  let discountLabel: string | null = null;
  let codeError: string | null = null;
  let welcomeReplaced = false;
  if (opts.code && lines.length) {
    const r = await checkCode(opts.code, { subtotal, email });
    if (!r.code) codeError = r.error;
    else if (r.amount < welcomeDiscount) codeError = `Tu ${RULES.welcomeDiscountPercent}% de bienvenida te ahorra más que este código, así que mantenemos el 5%.`;
    else {
      codeDiscount = r.amount;
      discountCode = r.code.code;
      discountLabel = codeLabel(r.code);
      welcomeReplaced = welcomeDiscount > 0;
      welcomeDiscount = 0;
    }
  }

  const afterWelcome = subtotal - welcomeDiscount - codeDiscount;
  const maxByRatio = Math.floor((afterWelcome * RULES.maxPointsDiscountRatio) / RULES.pointsBlockValueCents);
  const maxBlocks = Math.max(0, Math.min(Math.floor(pointsAvailable / RULES.pointsBlock), maxByRatio));
  const pointsMaxRedeemable = maxBlocks * RULES.pointsBlock;
  const pointsRedeemed = opts.usePoints ? pointsMaxRedeemable : 0;
  const pointsDiscount = pointsValue(pointsRedeemed);

  const shipping = lines.length ? RULES.shippingCents : 0;
  const total = Math.max(0, afterWelcome - pointsDiscount + shipping);

  return {
    lines,
    issues,
    subtotal,
    welcomeDiscount,
    welcomeEligible: eligible,
    discountCode,
    discountLabel,
    codeDiscount,
    codeError,
    welcomeReplaced,
    pointsAvailable,
    pointsMaxRedeemable,
    pointsRedeemed,
    pointsDiscount,
    shipping,
    total,
    pointsToEarn: Math.floor(total / 100) * RULES.pointsPerEuro,
  };
}
