import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { cache } from "react";
import { db } from "./db";

export const SESSION_COOKIE = "iw_session";
const SESSION_DAYS = 30;
const ADMIN_SESSION_HOURS = 12; // el panel pide volver a entrar cada día

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const u = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
  const expiresAt = new Date(Date.now() + (u?.role === "ADMIN" ? ADMIN_SESSION_HOURS * 3600_000 : SESSION_DAYS * 864e5));
  await db.session.create({ data: { tokenHash: hashToken(token), userId, expiresAt } });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  jar.delete(SESSION_COOKIE);
}

export const getCurrentUser = cache(async () => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
});

export async function requireUser(next = "/cuenta") {
  const user = await getCurrentUser();
  if (!user) redirect(`/iniciar-sesion?next=${encodeURIComponent(next)}`);
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/iniciar-sesion?next=/admin");
  return user;
}

/** Comprueba si el usuario aún puede disfrutar del 5% de bienvenida. */
export async function welcomeEligible(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || user.welcomeDiscountUsed) return false;
  const paid = await db.order.count({
    where: { userId, status: { in: ["PAID", "PREPARING", "SHIPPED", "DELIVERED"] } },
  });
  return paid === 0;
}
