import { headers } from "next/headers";
import { db } from "./db";

export async function clientIp() {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] || h.get("x-real-ip") || "local").trim();
}

/** Limita intentos por clave (persistido en BD para que funcione con varias instancias). */
export async function rateLimit(key: string, limit: number, windowSeconds: number) {
  const now = new Date();
  const existing = await db.rateLimit.findUnique({ where: { key } });
  if (!existing || existing.resetAt < now) {
    await db.rateLimit.upsert({
      where: { key },
      create: { key, count: 1, resetAt: new Date(now.getTime() + windowSeconds * 1000) },
      update: { count: 1, resetAt: new Date(now.getTime() + windowSeconds * 1000) },
    });
    return true;
  }
  if (existing.count >= limit) return false;
  await db.rateLimit.update({ where: { key }, data: { count: { increment: 1 } } });
  return true;
}
