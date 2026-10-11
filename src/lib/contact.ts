import "server-only";
import { db } from "./db";

const PLACEHOLDER = "34600000000";

/** Número de WhatsApp (solo cifras, con prefijo de país). Se cambia en Panel › Ajustes. */
export async function getWhatsapp(): Promise<{ number: string; configured: boolean }> {
  let saved = "";
  try {
    const row = await db.siteMeta.findUnique({ where: { key: "whatsapp" } });
    saved = row ? (JSON.parse(row.value).number ?? "") : "";
  } catch {}
  const number = saved || process.env.NEXT_PUBLIC_WHATSAPP || "";
  return { number: number || PLACEHOLDER, configured: Boolean(number) && number !== PLACEHOLDER };
}

/** Acepta "+34 600 11 22 33", "0034…" o "600112233" (España) y devuelve "34600112233". */
export function normalizePhone(raw: string): string | null {
  let d = raw.replace(/[^\d+]/g, "");
  if (d.startsWith("+")) d = d.slice(1);
  else if (d.startsWith("00")) d = d.slice(2);
  else if (/^[6789]\d{8}$/.test(d)) d = `34${d}`;
  d = d.replace(/\D/g, "");
  return /^[1-9]\d{9,14}$/.test(d) ? d : null;
}

export const formatPhone = (n: string) =>
  n.startsWith("34") && n.length === 11 ? `+34 ${n.slice(2, 5)} ${n.slice(5, 7)} ${n.slice(7, 9)} ${n.slice(9)}` : `+${n}`;
