"use client";

import Form from "@/components/forms/Form";
import { useActionState, useState } from "react";
import { disableTwoFactor, enableTwoFactor, startTwoFactor } from "@/app/actions/admin";

export default function TwoFactor({ enabled }: { enabled: boolean }) {
  const [setup, setSetup] = useState<{ secret?: string; qr?: string; error?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [onState, onAction, onPending] = useActionState(enableTwoFactor, null);
  const [offState, offAction, offPending] = useActionState(disableTwoFactor, null);
  const msg = (s: typeof onState) =>
    s?.error ? <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{s.error}</p>
    : s?.message ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{s.message}</p> : null;

  if (enabled || onState?.ok) {
    return (
      <div className="mt-4 space-y-4">
        <p className="flex items-center gap-2 text-sm font-medium text-emerald-800"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Activada: te pedimos un código de tu móvil al entrar.</p>
        {msg(onState)}
        {!offState?.ok && (
          <details className="text-sm">
            <summary className="cursor-pointer text-ink-muted hover:text-ink">Desactivar</summary>
            <Form action={offAction} className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <div><label className="label" htmlFor="off-pass">Contraseña</label><input id="off-pass" name="password" type="password" required className="input" /></div>
              <div><label className="label" htmlFor="off-code">Código</label><input id="off-code" name="code" inputMode="numeric" required maxLength={7} className="input font-mono" /></div>
              <button disabled={offPending} className="btn-outline">Desactivar</button>
            </Form>
          </details>
        )}
        {msg(offState)}
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4 text-sm">
      {!setup?.qr ? (
        <button
          type="button"
          disabled={loading}
          onClick={async () => { setLoading(true); setSetup(await startTwoFactor()); setLoading(false); }}
          className="btn-primary"
        >
          {loading ? "Preparando…" : "Activar verificación en dos pasos"}
        </button>
      ) : (
        <div className="grid gap-5 sm:grid-cols-[auto_1fr] sm:items-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={setup.qr} alt="Código QR para tu app de autenticación" width={180} height={180} className="rounded-xl border border-line" />
          <div className="space-y-3">
            <p>1. Instala <b>Google Authenticator</b> o <b>Microsoft Authenticator</b> en tu móvil.</p>
            <p>2. Escanea el código QR. Si no puedes, introduce esta clave: <code className="break-all rounded bg-stone px-1.5 py-0.5 font-mono text-xs">{setup.secret}</code></p>
            <Form action={onAction} className="flex gap-2">
              <input name="code" inputMode="numeric" autoComplete="one-time-code" required maxLength={7} placeholder="3. Código de 6 cifras" className="input font-mono" />
              <button disabled={onPending} className="btn-primary shrink-0">Confirmar</button>
            </Form>
          </div>
        </div>
      )}
      {setup?.error && <p className="text-rose-700">{setup.error}</p>}
      {msg(onState)}
    </div>
  );
}
