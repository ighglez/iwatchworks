import { requireAdmin } from "@/lib/auth";
import { getBankDetails, paymentMethod } from "@/lib/payments";
import { RULES } from "@/lib/config";
import { PageTitle } from "../ui";
import BankForm from "./BankForm";
import TwoFactor from "./TwoFactor";
import { db } from "@/lib/db";
import { fmtDate } from "../ui";

export const metadata = { title: "Ajustes" };
export const dynamic = "force-dynamic";

export default async function Ajustes() {
  const admin = await requireAdmin();
  const [bank, meta, log] = await Promise.all([
    getBankDetails(),
    db.siteMeta.findUnique({ where: { key: "bank" } }),
    db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 15 }),
  ]);
  let last: { updatedBy?: string; updatedAt?: string } = {};
  try { last = meta ? JSON.parse(meta.value) : {}; } catch {}
  return (
    <>
      <PageTitle title="Ajustes" subtitle="Datos de pago y seguridad del panel" />
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="card p-6">
          <h2 className="text-2xl">Cuenta para transferencias</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Aparecen al confirmar el pedido, en el email al cliente y en la página de su pedido. El concepto será siempre el número de pedido.
          </p>
          {last.updatedAt && <p className="mt-2 text-xs text-ink-muted">Último cambio: {fmtDate(new Date(last.updatedAt))} por {last.updatedBy}</p>}
          <BankForm needsCode={Boolean(admin.totpSecret)} initial={bank.configured ? { holder: bank.holder, iban: bank.iban, bic: bank.bic, bank: bank.bank } : { holder: "", iban: "", bic: "", bank: "" }} />
        </div>
        <div className="card space-y-3 p-6 text-sm text-ink-soft">
          <h2 className="text-xl text-ink">Cómo funciona</h2>
          <p>Forma de pago activa: <b className="text-ink">{paymentMethod() === "transfer" ? "transferencia bancaria" : "pasarela de pago"}</b>.</p>
          <p>Al hacer el pedido, el reloj queda reservado {RULES.transferDays} días. Si la transferencia no llega en ese plazo, el pedido se cancela solo y el reloj vuelve a estar disponible.</p>
          <p>Cuando veas el ingreso en tu banco, abre el pedido y pulsa <b className="text-ink">Transferencia recibida</b>: el cliente recibe la confirmación y sus puntos.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="card p-6">
          <h2 className="text-2xl">Verificación en dos pasos</h2>
          <p className="mt-2 text-sm text-ink-soft">Además de la contraseña, el panel pedirá un código que cambia cada 30 segundos en tu móvil. Aunque alguien averigüe tu contraseña, no podrá entrar ni cambiar tu cuenta bancaria.</p>
          <TwoFactor enabled={Boolean(admin.totpSecret)} />
        </div>
        <div className="card p-6">
          <h2 className="text-xl">Actividad de seguridad</h2>
          {log.length === 0 ? (
            <p className="mt-3 text-sm text-ink-muted">Sin actividad registrada todavía.</p>
          ) : (
            <ul className="mt-4 divide-y divide-line text-sm">
              {log.map((l) => (
                <li key={l.id} className="py-2.5">
                  <p className={l.action.includes("fallido") || l.action.includes("rechazado") || l.action.includes("incorrecto") ? "text-rose-700" : ""}>{l.action}</p>
                  <p className="text-xs text-ink-muted">{fmtDate(l.createdAt)} · {l.actor}{l.ip ? ` · ${l.ip}` : ""}{l.detail ? ` · ${l.detail}` : ""}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
