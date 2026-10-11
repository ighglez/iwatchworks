"use client";

import { useState } from "react";
import { CheckIcon } from "../icons";

type Props = {
  holder: string; iban: string; bic: string; bank: string; configured: boolean;
  amount: string; concept: string; deadline: string;
};

function Row({ label, value, copy, strong }: { label: string; value: string; copy?: string; strong?: boolean }) {
  const [done, setDone] = useState(false);
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd className="flex min-w-0 items-center gap-3 text-right">
        <span className={`break-all ${strong ? "text-lg font-semibold tabular-nums" : "font-medium"}`}>{value}</span>
        {copy && (
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(copy).then(() => { setDone(true); setTimeout(() => setDone(false), 1800); })}
            className="shrink-0 rounded-full border border-line px-3 py-1 text-xs text-ink-soft transition hover:border-gold hover:text-gold"
            aria-label={`Copiar ${label}`}
          >
            {done ? <span className="flex items-center gap-1"><CheckIcon className="h-3.5 w-3.5" /> Copiado</span> : "Copiar"}
          </button>
        )}
      </dd>
    </div>
  );
}

export default function TransferDetails(p: Props) {
  return (
    <section className="rounded-3xl border border-gold/30 bg-white p-6 md:p-8" aria-labelledby="transfer-title">
      <p className="eyebrow">Pago por transferencia bancaria</p>
      <h2 id="transfer-title" className="mt-3 text-2xl md:text-3xl">Datos para la transferencia</h2>
      <p className="mt-2 text-sm text-ink-soft">Haz el ingreso antes del <b className="text-ink">{p.deadline}</b>. Hasta entonces, tu reloj queda reservado.</p>
      {!p.configured && (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">Datos bancarios de ejemplo: la tienda aún no ha configurado su cuenta.</p>
      )}
      <dl className="mt-5 divide-y divide-line border-y border-line">
        <Row label="Titular" value={p.holder} copy={p.holder} />
        <Row label="IBAN" value={p.iban} copy={p.iban.replace(/\s/g, "")} />
        {p.bic && <Row label="BIC/SWIFT" value={p.bic} copy={p.bic} />}
        {p.bank && <Row label="Banco" value={p.bank} />}
        <Row label="Importe" value={p.amount} copy={p.amount.replace(/[^\d,]/g, "")} strong />
        <Row label="Concepto" value={p.concept} copy={p.concept} strong />
      </dl>
      <ol className="mt-6 grid gap-4 text-sm text-ink-soft sm:grid-cols-3">
        {[
          ["1", "Haz la transferencia", "Desde tu banco, con el número de pedido como concepto."],
          ["2", "La confirmamos", "Te avisamos por email en cuanto recibimos el ingreso."],
          ["3", "Enviamos tu reloj", "Asegurado y con seguimiento, en 24 a 72 h."],
        ].map(([n, t, d]) => (
          <li key={n} className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold-soft text-xs font-semibold text-gold">{n}</span>
            <span><b className="block font-medium text-ink">{t}</b>{d}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
