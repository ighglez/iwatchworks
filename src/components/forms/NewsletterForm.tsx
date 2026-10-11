"use client";

import { useActionState } from "react";
import { subscribeNewsletter } from "@/app/actions/public";

export default function NewsletterForm() {
  const [state, action, pending] = useActionState(subscribeNewsletter, null);
  if (state?.ok) return <p className="mt-6 text-sm text-gold">{state.message}</p>;
  return (
    <form action={action} className="mt-6 max-w-md">
      <div className="flex rounded-full border border-ink/15 bg-white p-1 focus-within:border-gold">
        <label htmlFor="nl-email" className="sr-only">Email</label>
        <input id="nl-email" name="email" type="email" required placeholder="Tu email" autoComplete="email"
          className="w-full bg-transparent px-4 text-sm text-ink placeholder:text-ink-muted focus:outline-none" />
        <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
        <button disabled={pending} className="shrink-0 rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-white hover:bg-gold-dark disabled:opacity-60">
          {pending ? "…" : "Suscribirme"}
        </button>
      </div>
      {state?.error && <p className="mt-2 text-xs text-rose-300">{state.error}</p>}
      <p className="mt-3 text-xs text-ink-muted">Puedes darte de baja en cualquier momento.</p>
    </form>
  );
}
