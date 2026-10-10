"use client";

import { useActionState } from "react";
import { subscribeNewsletter } from "@/app/actions/public";

export default function NewsletterForm() {
  const [state, action, pending] = useActionState(subscribeNewsletter, null);
  if (state?.ok) return <p className="mt-4 text-sm text-gold">{state.message}</p>;
  return (
    <form action={action} className="mt-4 flex">
      <label htmlFor="nl-email" className="sr-only">Email</label>
      <input id="nl-email" name="email" type="email" required placeholder="tu@email.com" autoComplete="email"
        className="w-full border border-white/20 bg-transparent px-4 py-3 text-sm text-ivory placeholder:text-ivory/40 focus:border-gold focus:outline-none" />
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <button disabled={pending} className="bg-gold px-5 text-sm font-medium text-ink hover:bg-gold-light disabled:opacity-60">
        {pending ? "…" : "Suscribirse"}
      </button>
      {state?.error && <p className="mt-2 text-xs text-rose-300">{state.error}</p>}
    </form>
  );
}
