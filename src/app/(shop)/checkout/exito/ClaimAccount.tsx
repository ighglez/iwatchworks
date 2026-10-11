"use client";

import { useActionState } from "react";
import { claimOrderAccount } from "@/app/actions/order";
import { GiftIcon } from "@/components/icons";

export default function ClaimAccount({ order, token, points }: { order: string; token: string; points: number }) {
  const [state, action, pending] = useActionState(claimOrderAccount, null);
  if (state?.ok)
    return <p className="mt-8 rounded-2xl bg-gold-soft p-5 text-center text-sm">Cuenta creada. Te hemos sumado {points} puntos. ¡Bienvenido al club!</p>;
  return (
    <form action={action} className="mt-8 rounded-2xl border border-gold-light bg-gold-soft/50 p-6">
      <p className="flex items-center gap-2 font-medium"><GiftIcon className="h-4 w-4 text-gold-dark" /> Guarda tus {points} puntos de esta compra</p>
      <p className="mt-1 text-sm text-ink-soft">Solo falta una contraseña: podrás seguir tu pedido y canjear los puntos en la próxima compra. Opcional.</p>
      <input type="hidden" name="order" value={order} />
      <input type="hidden" name="t" value={token} />
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input name="password" type="password" autoComplete="new-password" minLength={8} required placeholder="Contraseña (mín. 8 caracteres)" className="input" aria-label="Contraseña" />
        <button disabled={pending} className="btn-primary shrink-0">{pending ? "Creando…" : "Crear cuenta"}</button>
      </div>
      {state?.error && <p className="mt-2 text-sm text-rose-700">{state.error}</p>}
    </form>
  );
}
