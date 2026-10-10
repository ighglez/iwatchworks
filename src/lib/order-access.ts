import "server-only";
import { timingSafeEqual } from "crypto";
import { db } from "./db";
import { getCurrentUser } from "./auth";

function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

/** Devuelve el pedido solo si quien lo pide tiene el enlace secreto, es su dueño o es admin. */
export async function getOrderForViewer(number: string, token?: string | null) {
  const order = await db.order.findUnique({
    where: { number },
    include: { items: true, events: { orderBy: { createdAt: "asc" } } },
  });
  if (!order) return null;
  if (token && safeEqual(token, order.accessToken)) return order;
  const user = await getCurrentUser();
  if (user && (user.role === "ADMIN" || (order.userId && order.userId === user.id))) return order;
  return null;
}
