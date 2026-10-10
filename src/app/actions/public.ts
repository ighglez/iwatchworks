"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export type FormState = { ok?: boolean; error?: string; message?: string } | null;

const emailSchema = z.string().trim().toLowerCase().email().max(200);

export async function subscribeNewsletter(_: FormState, form: FormData): Promise<FormState> {
  if (form.get("website")) return { ok: true, message: "¡Gracias!" }; // trampa antispam
  const email = emailSchema.safeParse(form.get("email"));
  if (!email.success) return { error: "Introduce un email válido." };
  if (!(await rateLimit(`news:${await clientIp()}`, 5, 3600))) return { error: "Demasiados intentos. Prueba más tarde." };
  await db.newsletterSubscriber.upsert({ where: { email: email.data }, create: { email: email.data }, update: {} });
  return { ok: true, message: "¡Gracias! Te avisaremos de lanzamientos y ediciones limitadas." };
}

const contactSchema = z.object({
  name: z.string().trim().min(2, "Indica tu nombre").max(100),
  email: emailSchema,
  message: z.string().trim().min(10, "Cuéntanos un poco más (mín. 10 caracteres)").max(3000),
});

export async function sendContact(_: FormState, form: FormData): Promise<FormState> {
  if (form.get("website")) return { ok: true, message: "Mensaje enviado." };
  const parsed = contactSchema.safeParse({ name: form.get("name"), email: form.get("email"), message: form.get("message") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  if (!(await rateLimit(`contact:${await clientIp()}`, 5, 3600))) return { error: "Has enviado varios mensajes seguidos. Prueba más tarde." };
  await db.contactMessage.create({ data: parsed.data });
  return { ok: true, message: "Mensaje recibido. Te responderemos en menos de 24 h laborables." };
}
