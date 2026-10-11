"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createDiscountCode } from "@/app/actions/discounts";
import Form from "@/components/forms/Form";

function randomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return `IW${[...bytes].map((b) => alphabet[b % alphabet.length]).join("")}`;
}

export default function CodeForm() {
  const [state, action, pending] = useActionState(createDiscountCode, null);
  const [kind, setKind] = useState("PERCENT");
  const [code, setCode] = useState("");
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) { form.current?.reset(); setCode(""); setKind("PERCENT"); }
  }, [state]);

  return (
    <Form action={action} ref={form} className="card grid gap-4 p-6 md:grid-cols-4">
      <div className="md:col-span-2">
        <label className="label" htmlFor="code">Código</label>
        <div className="flex gap-2">
          <input id="code" name="code" required value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s+/g, ""))} placeholder="Ej.: NAVIDAD10" maxLength={30} autoComplete="off" className="input py-2.5 uppercase tracking-wider" />
          <button type="button" onClick={() => setCode(randomCode())} className="btn-outline shrink-0 px-4 py-2.5 text-xs">Generar</button>
        </div>
      </div>
      <div>
        <label className="label" htmlFor="kind">Tipo</label>
        <select id="kind" name="kind" value={kind} onChange={(e) => setKind(e.target.value)} className="input py-2.5">
          <option value="PERCENT">Porcentaje (%)</option>
          <option value="AMOUNT">Importe fijo (€)</option>
        </select>
      </div>
      <div>
        <label className="label" htmlFor="value">{kind === "PERCENT" ? "Descuento (%)" : "Descuento (€)"}</label>
        <input id="value" name="value" required inputMode="decimal" placeholder={kind === "PERCENT" ? "10" : "50"} className="input py-2.5" />
      </div>

      <div className="md:col-span-2">
        <label className="label" htmlFor="description">Nota interna <span className="normal-case tracking-normal text-ink-muted">(opcional, solo la ves tú)</span></label>
        <input id="description" name="description" maxLength={120} placeholder="Ej.: campaña Instagram, cliente Juan…" className="input py-2.5" />
      </div>
      <div>
        <label className="label" htmlFor="minSubtotal">Compra mínima (€)</label>
        <input id="minSubtotal" name="minSubtotal" inputMode="decimal" placeholder="Sin mínimo" className="input py-2.5" />
      </div>
      <div>
        <label className="label" htmlFor="maxUses">Usos totales</label>
        <input id="maxUses" name="maxUses" type="number" min={1} placeholder="Ilimitados" className="input py-2.5" />
      </div>

      <div>
        <label className="label" htmlFor="startsAt">Válido desde</label>
        <input id="startsAt" name="startsAt" type="date" className="input py-2.5" />
      </div>
      <div>
        <label className="label" htmlFor="expiresAt">Válido hasta</label>
        <input id="expiresAt" name="expiresAt" type="date" className="input py-2.5" />
      </div>
      <label className="flex items-center gap-2 text-sm text-ink-soft md:col-span-2 md:self-end md:pb-3">
        <input type="checkbox" name="onePerCustomer" defaultChecked className="h-4 w-4 accent-gold" /> Una sola vez por cliente
      </label>

      <div className="flex flex-wrap items-center gap-4 md:col-span-4">
        <button disabled={pending} className="btn-primary px-8 py-3">{pending ? "Creando…" : "Crear código"}</button>
        {state?.error && <p role="alert" className="text-sm text-rose-700">{state.error}</p>}
        {state?.message && <p className="text-sm text-emerald-700">{state.message}</p>}
      </div>
    </Form>
  );
}
