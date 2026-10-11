"use client";

import { useActionState } from "react";
import { saveBankDetails } from "@/app/actions/admin";

type B = { holder: string; iban: string; bic: string; bank: string };

export default function BankForm({ initial }: { initial: B }) {
  const [state, action, pending] = useActionState(saveBankDetails, null);
  return (
    <form action={action} className="mt-6 space-y-4">
      <div>
        <label className="label" htmlFor="holder">Titular de la cuenta</label>
        <input id="holder" name="holder" defaultValue={initial.holder} required maxLength={120} className="input" placeholder="Nombre o razón social" />
      </div>
      <div>
        <label className="label" htmlFor="iban">IBAN</label>
        <input id="iban" name="iban" defaultValue={initial.iban} required maxLength={42} className="input font-mono" placeholder="ES00 0000 0000 0000 0000 0000" autoComplete="off" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="bic">BIC/SWIFT <span className="text-ink-muted">(opcional)</span></label>
          <input id="bic" name="bic" defaultValue={initial.bic} maxLength={11} className="input font-mono" />
        </div>
        <div>
          <label className="label" htmlFor="bank">Banco <span className="text-ink-muted">(opcional)</span></label>
          <input id="bank" name="bank" defaultValue={initial.bank} maxLength={80} className="input" />
        </div>
      </div>
      {state?.error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{state.error}</p>}
      {state?.message && <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{state.message}</p>}
      <button disabled={pending} className="btn-primary">{pending ? "Guardando…" : "Guardar datos bancarios"}</button>
    </form>
  );
}
