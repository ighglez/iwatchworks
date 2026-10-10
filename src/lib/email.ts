import { SITE } from "./config";

type Mail = { to: string; subject: string; html: string };

/** Envía email transaccional con Resend si hay clave; si no, lo muestra en consola. */
export async function sendMail(mail: Mail) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info(`[email] Para: ${mail.to} · ${mail.subject}`);
    return;
  }
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.EMAIL_FROM || `${SITE.name} <no-reply@iwatchworks.com>`, ...mail }),
    });
  } catch (e) {
    console.error("[email] error", e);
  }
}

export function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
