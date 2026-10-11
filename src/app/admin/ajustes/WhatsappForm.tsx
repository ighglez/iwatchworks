"use client";

import { useActionState } from "react";
import { saveWhatsapp } from "@/app/actions/admin";
import Form from "@/components/forms/Form";

export default function WhatsappForm({ initial }: { initial: string }) {
  const [state, action, pending] = useActionState(saveWhatsapp, null);
  return (
    <Form action={action} className="mt-5">
      <label className="label" htmlFor="whatsapp">Móvil de WhatsApp</label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input id="whatsapp" name="whatsapp" type="tel" required defaultValue={initial} placeholder="+34 612 345 678" autoComplete="off" className="input py-2.5" />
        <button disabled={pending} className="btn-primary shrink-0 px-8 py-2.5">{pending ? "Guardando…" : "Guardar"}</button>
      </div>
      <p className="mt-2 text-xs text-ink-muted">Si no pones prefijo se entiende que es un móvil español (+34).</p>
      {state?.error && <p role="alert" className="mt-3 text-sm text-rose-700">{state.error}</p>}
      {state?.message && <p className="mt-3 text-sm text-emerald-700">{state.message}</p>}
    </Form>
  );
}
