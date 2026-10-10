"use client";

import Form from "@/components/forms/Form";
import { useActionState } from "react";
import { sendContact } from "@/app/actions/public";
import { CheckIcon } from "../icons";

export default function ContactForm() {
  const [state, action, pending] = useActionState(sendContact, null);
  if (state?.ok)
    return (
      <div className="card flex items-start gap-3 p-6">
        <CheckIcon className="h-6 w-6 text-gold-dark" />
        <p className="text-sm">{state.message}</p>
      </div>
    );
  return (
    <Form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="c-name">Nombre</label>
          <input id="c-name" name="name" required className="input" autoComplete="name" />
        </div>
        <div>
          <label className="label" htmlFor="c-email">Email</label>
          <input id="c-email" name="email" type="email" required className="input" autoComplete="email" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="c-msg">Mensaje</label>
        <textarea id="c-msg" name="message" required rows={5} className="input resize-none" placeholder="¿En qué reloj estás interesado?" />
      </div>
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      {state?.error && <p className="text-sm text-rose-700">{state.error}</p>}
      <button disabled={pending} className="btn-primary w-full sm:w-auto">{pending ? "Enviando…" : "Enviar mensaje"}</button>
    </Form>
  );
}
