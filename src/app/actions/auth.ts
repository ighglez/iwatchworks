"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { createSession, destroySession, getCurrentUser, hashPassword, hashToken, verifyPassword } from "@/lib/auth";
import { verifyTotp } from "@/lib/totp";
import { audit } from "@/lib/audit";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export type AuthState = { error?: string; ok?: boolean; message?: string } | null;

function safeNext(v: FormDataEntryValue | null, fallback = "/cuenta") {
  const s = typeof v === "string" ? v : "";
  return s.startsWith("/") && !s.startsWith("//") && !s.startsWith("/\\") ? s : fallback;
}

// Hash ficticio para igualar tiempos cuando el email no existe.
const DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEeO5pDbkOFP0V4JGSlCyBkzq4aWQ.yxMJG";

export async function login(_: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");
  const ip = await clientIp();
  if (!(await rateLimit(`login:${ip}`, 10, 900)) || !(await rateLimit(`login:${email}`, 8, 900))) {
    return { error: "Demasiados intentos. Espera 15 minutos e inténtalo de nuevo." };
  }
  const user = await db.user.findUnique({ where: { email } });
  const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) {
    if (user?.role === "ADMIN") await audit(email, "Acceso al panel fallido", "Contraseña incorrecta");
    return { error: "Email o contraseña incorrectos." };
  }
  const next = safeNext(form.get("next"), user.role === "ADMIN" ? "/admin" : "/cuenta");
  if (user.totpSecret) {
    // Segundo paso: código de la app de autenticación
    const token = randomBytes(32).toString("base64url");
    await db.loginChallenge.deleteMany({ where: { OR: [{ userId: user.id }, { expiresAt: { lt: new Date() } }] } });
    await db.loginChallenge.create({ data: { tokenHash: hashToken(token), userId: user.id, next, expiresAt: new Date(Date.now() + 5 * 60_000) } });
    (await cookies()).set(CHALLENGE_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 300 });
    redirect("/iniciar-sesion/verificacion");
  }
  await createSession(user.id);
  if (user.role === "ADMIN") await audit(user.email, "Acceso al panel");
  redirect(next);
}

const CHALLENGE_COOKIE = "iw_2fa";

export async function verifyLoginCode(_: AuthState, form: FormData): Promise<AuthState> {
  const jar = await cookies();
  const token = jar.get(CHALLENGE_COOKIE)?.value;
  const challenge = token ? await db.loginChallenge.findUnique({ where: { tokenHash: hashToken(token) } }) : null;
  if (!challenge || challenge.expiresAt < new Date() || challenge.attempts >= 5) {
    if (challenge) await db.loginChallenge.delete({ where: { id: challenge.id } }).catch(() => {});
    jar.delete(CHALLENGE_COOKIE);
    return { error: "La verificación ha caducado. Vuelve a iniciar sesión." };
  }
  const user = await db.user.findUnique({ where: { id: challenge.userId } });
  const step = user?.totpSecret ? verifyTotp(user.totpSecret, String(form.get("code") || ""), user.totpLastStep) : null;
  if (!user || step == null) {
    await db.loginChallenge.update({ where: { id: challenge.id }, data: { attempts: { increment: 1 } } });
    if (user) await audit(user.email, "Código de verificación incorrecto");
    return { error: "Código incorrecto. Revisa la app y prueba con el código actual." };
  }
  await db.user.update({ where: { id: user.id }, data: { totpLastStep: step } });
  await db.loginChallenge.delete({ where: { id: challenge.id } });
  jar.delete(CHALLENGE_COOKIE);
  await createSession(user.id);
  if (user.role === "ADMIN") await audit(user.email, "Acceso al panel", "Con verificación en dos pasos");
  redirect(challenge.next || "/admin");
}

const registerSchema = z.object({
  name: z.string().trim().min(2, "Indica tu nombre").max(100),
  email: z.string().trim().toLowerCase().email("Email no válido").max(200),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(200),
  marketing: z.boolean(),
});

export async function register(_: AuthState, form: FormData): Promise<AuthState> {
  if (!(await rateLimit(`register:${await clientIp()}`, 5, 3600))) return { error: "Demasiados registros desde esta conexión." };
  if (form.get("terms") !== "on") return { error: "Debes aceptar la política de privacidad." };
  const parsed = registerSchema.safeParse({
    name: form.get("name"),
    email: form.get("email"),
    password: form.get("password"),
    marketing: form.get("marketing") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const d = parsed.data;
  if (await db.user.findUnique({ where: { email: d.email } })) {
    return { error: "Ya existe una cuenta con este email. Inicia sesión o recupera tu contraseña." };
  }
  const user = await db.user.create({
    data: { name: d.name, email: d.email, passwordHash: await hashPassword(d.password), marketingOptIn: d.marketing },
  });
  if (d.marketing) await db.newsletterSubscriber.upsert({ where: { email: d.email }, create: { email: d.email }, update: {} });
  await createSession(user.id);
  redirect(safeNext(form.get("next"), "/cuenta?bienvenida=1"));
}

export async function logout() {
  await destroySession();
  redirect("/");
}

const profileSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().max(20).optional(),
  address: z.string().trim().max(200).optional(),
  postalCode: z.string().trim().max(10).optional(),
  city: z.string().trim().max(80).optional(),
  province: z.string().trim().max(80).optional(),
});

export async function updateProfile(_: AuthState, form: FormData): Promise<AuthState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sesión caducada." };
  const parsed = profileSchema.safeParse(Object.fromEntries(["name", "phone", "address", "postalCode", "city", "province"].map((k) => [k, form.get(k) ?? undefined])));
  if (!parsed.success) return { error: "Revisa los datos." };
  await db.user.update({ where: { id: user.id }, data: parsed.data });
  return { ok: true, message: "Datos guardados." };
}

export async function changePassword(_: AuthState, form: FormData): Promise<AuthState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sesión caducada." };
  if (!(await rateLimit(`pwd:${user.id}`, 5, 900))) return { error: "Demasiados intentos." };
  const current = String(form.get("current") || "");
  const next = String(form.get("next") || "");
  if (next.length < 8) return { error: "La nueva contraseña debe tener al menos 8 caracteres." };
  if (!(await verifyPassword(current, user.passwordHash))) return { error: "La contraseña actual no es correcta." };
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(next) } });
  // Cierra el resto de sesiones abiertas
  await db.session.deleteMany({ where: { userId: user.id } });
  await createSession(user.id);
  if (user.role === "ADMIN") await audit(user.email, "Contraseña cambiada");
  return { ok: true, message: "Contraseña actualizada. Hemos cerrado tus otras sesiones." };
}

export async function requestPasswordReset(_: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") || "").trim().toLowerCase();
  if (!(await rateLimit(`reset:${await clientIp()}`, 5, 3600))) return { error: "Demasiados intentos." };
  const user = await db.user.findUnique({ where: { email } });
  if (user) {
    const { randomBytes, createHash } = await import("crypto");
    const token = randomBytes(32).toString("base64url");
    await db.passwordReset.create({
      data: { userId: user.id, tokenHash: createHash("sha256").update(token).digest("hex"), expiresAt: new Date(Date.now() + 3600_000) },
    });
    const { sendMail } = await import("@/lib/email");
    const { SITE } = await import("@/lib/config");
    await sendMail({
      to: user.email,
      subject: "Restablecer tu contraseña · IWatchWorks",
      html: `<p>Hola ${user.name.split(" ")[0]}, pulsa el enlace para elegir una nueva contraseña (válido 1 hora):</p><p><a href="${SITE.url}/recuperar/${token}">Restablecer contraseña</a></p><p>Si no lo has pedido tú, ignora este email.</p>`,
    });
    if (!process.env.RESEND_API_KEY && process.env.NODE_ENV !== "production") console.info(`[email] enlace: ${SITE.url}/recuperar/${token}`);
  }
  // Misma respuesta exista o no la cuenta
  return { ok: true, message: "Si existe una cuenta con ese email, te hemos enviado un enlace para restablecer la contraseña." };
}

export async function resetPassword(_: AuthState, form: FormData): Promise<AuthState> {
  const { createHash } = await import("crypto");
  const token = String(form.get("token") || "");
  const password = String(form.get("password") || "");
  if (password.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres." };
  const reset = await db.passwordReset.findUnique({ where: { tokenHash: createHash("sha256").update(token).digest("hex") } });
  if (!reset || reset.usedAt || reset.expiresAt < new Date()) return { error: "El enlace ha caducado. Solicita uno nuevo." };
  await db.$transaction([
    db.user.update({ where: { id: reset.userId }, data: { passwordHash: await hashPassword(password) } }),
    db.passwordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() } }),
    db.session.deleteMany({ where: { userId: reset.userId } }),
  ]);
  await createSession(reset.userId);
  redirect("/cuenta");
}
