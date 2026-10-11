import "server-only";
import { db } from "./db";
import { clientIp } from "./rate-limit";

/** Deja constancia de una acción sensible. Nunca rompe la acción si falla. */
export async function audit(actor: string, action: string, detail?: string) {
  try {
    await db.auditLog.create({ data: { actor, action, detail: detail?.slice(0, 500), ip: (await clientIp()).slice(0, 64) } });
  } catch (e) {
    console.error("[audit]", e);
  }
}
