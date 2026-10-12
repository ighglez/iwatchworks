import { SITE } from "./config";

type Mail = { to: string; subject: string; html: string; text?: string };

/** Remitente: EMAIL_FROM en Vercel, o info@ de la tienda. El dominio debe estar verificado en Resend. */
export const emailFrom = () => process.env.EMAIL_FROM || `${SITE.name} <${SITE.email}>`;

/** Envía email transaccional con Resend si hay clave; si no, lo muestra en consola. */
export async function sendMail(mail: Mail): Promise<{ ok: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info(`[email] (sin RESEND_API_KEY, no se envía) Para: ${mail.to} · ${mail.subject}`);
    return { ok: false, error: "Falta RESEND_API_KEY en Vercel." };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: emailFrom(), reply_to: SITE.email, ...mail }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[email] Resend respondió", res.status, detail);
      return { ok: false, error: `Resend respondió ${res.status}: ${detail.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (e) {
    console.error("[email] error", e);
    return { ok: false, error: "No se ha podido conectar con Resend." };
  }
}

export function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
