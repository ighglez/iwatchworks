import "server-only";
import { db } from "./db";
import { RULES } from "./config";
import { demoPaymentsEnabled, stripeEnabled } from "./stripe";

/**
 * Forma de pago de la tienda. Por defecto, transferencia bancaria.
 * PAYMENT_METHOD=stripe (con claves) o PAYMENT_METHOD=demo vuelven a la pasarela.
 */
export function paymentMethod(): "transfer" | "stripe" | "demo" {
  const m = process.env.PAYMENT_METHOD;
  if (m === "stripe" && stripeEnabled()) return "stripe";
  if (m === "demo" && demoPaymentsEnabled()) return "demo";
  return "transfer";
}

export type BankDetails = { holder: string; iban: string; bic: string; bank: string; configured: boolean };

// Datos de ejemplo: se sustituyen desde Admin › Ajustes (o con las variables BANK_*).
const PLACEHOLDER = { holder: "[Titular de la cuenta]", iban: "ES00 0000 0000 0000 0000 0000", bic: "[BIC/SWIFT]", bank: "[Nombre del banco]" };

export async function getBankDetails(): Promise<BankDetails> {
  const row = await db.siteMeta.findUnique({ where: { key: "bank" } });
  let saved: Partial<BankDetails> = {};
  try {
    saved = row ? JSON.parse(row.value) : {};
  } catch {}
  const holder = saved.holder || process.env.BANK_HOLDER || "";
  const iban = saved.iban || process.env.BANK_IBAN || "";
  const bic = saved.bic || process.env.BANK_BIC || "";
  const bank = saved.bank || process.env.BANK_NAME || "";
  const configured = Boolean(holder && iban);
  return {
    holder: holder || PLACEHOLDER.holder,
    iban: iban || PLACEHOLDER.iban,
    bic: bic || (configured ? "" : PLACEHOLDER.bic),
    bank: bank || (configured ? "" : PLACEHOLDER.bank),
    configured,
  };
}

export function formatIban(iban: string) {
  return iban.replace(/\s+/g, "").toUpperCase().replace(/(.{4})/g, "$1 ").trim();
}

/** Fecha límite para recibir la transferencia. */
export function transferDeadline(createdAt: Date) {
  return new Date(createdAt.getTime() + RULES.transferDays * 86_400_000);
}
