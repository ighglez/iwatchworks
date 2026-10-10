import "server-only";
import { db } from "./db";
import { RULES } from "./config";
import { parseImages } from "./product";
import { welcomeEligible } from "./auth";

export type CartInput = { productId: string; quantity: number }[];

export type QuoteLine = {
  productId: string;
  slug: string;
  name: string;
  brand: string;
  reference: string;
  image: string | null;
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
  opts: { userId?: string | null; usePoints?: boolean; welcome?: boolean } = {},
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
      price: p.price,
      quantity,
      stock: p.stock,
      lineTotal: p.price * quantity,
    });
  }

  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);

  let eligible = false;
  let pointsAvailable = 0;
  if (opts.userId) {
    eligible = await welcomeEligible(opts.userId);
    const u = await db.user.findUnique({ where: { id: opts.userId }, select: { points: true } });
    pointsAvailable = u?.points ?? 0;
  } else if (opts.welcome) {
    eligible = true;
  }
  const welcomeDiscount = eligible ? Math.round((subtotal * RULES.welcomeDiscountPercent) / 100) : 0;

  const afterWelcome = subtotal - welcomeDiscount;
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
    pointsAvailable,
    pointsMaxRedeemable,
    pointsRedeemed,
    pointsDiscount,
    shipping,
    total,
    pointsToEarn: Math.floor(total / 100) * RULES.pointsPerEuro,
  };
}
