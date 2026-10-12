"use client";

import { useActionState } from "react";
import { sendTestEmail } from "@/app/actions/admin";
import Form from "@/components/forms/Form";

export default function TestSend({ kind, to, disabled }: { kind: string; to: string; disabled: boolean }) {
  const [state, action, pending] = useActionState(sendTestEmail, null);
  return (
    <Form action={action} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="kind" value={kind} />
      {state?.error && <span className="text-sm text-rose-700">{state.error}</span>}
      {state?.message && <span className="text-sm text-emerald-700">{state.message}</span>}
      <button disabled={pending || disabled} title={disabled ? "Primero conecta Resend en Vercel" : `Se enviará a ${to}`} className="btn-outline px-5 py-2.5 text-sm">
        {pending ? "Enviando…" : "Enviarme una prueba"}
      </button>
    </Form>
  );
}
