"use client";

import Form from "@/components/forms/Form";
import Link from "next/link";
import { useActionState } from "react";
import { changePassword, login, register, requestPasswordReset, resetPassword, updateProfile, type AuthState, verifyLoginCode } from "@/app/actions/auth";

function Msg({ state }: { state: AuthState }) {
  if (state?.error) return <p role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{state.error}</p>;
  if (state?.message) return <p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{state.message}</p>;
  return null;
}

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(login, null);
  return (
    <Form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="input" />
      </div>
      <div>
        <div className="flex justify-between">
          <label className="label" htmlFor="password">Contraseña</label>
          <Link href="/recuperar" className="text-xs link-gold">¿La has olvidado?</Link>
        </div>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="input" />
      </div>
      <Msg state={state} />
      <button disabled={pending} className="btn-primary w-full">{pending ? "Entrando…" : "Iniciar sesión"}</button>
    </Form>
  );
}

export function TwoFactorForm() {
  const [state, action, pending] = useActionState(verifyLoginCode, null);
  return (
    <Form action={action} className="space-y-4">
      <div>
        <label className="label" htmlFor="code">Código de 6 cifras</label>
        <input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,7}" maxLength={7} required autoFocus className="input text-center font-mono text-2xl tracking-[0.4em]" />
      </div>
      <Msg state={state} />
      <button disabled={pending} className="btn-primary w-full">{pending ? "Comprobando…" : "Verificar y entrar"}</button>
    </Form>
  );
}

export function RegisterForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(register, null);
  return (
    <Form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <div>
        <label className="label" htmlFor="name">Nombre</label>
        <input id="name" name="name" autoComplete="name" required className="input" />
      </div>
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="input" />
      </div>
      <div>
        <label className="label" htmlFor="password">Contraseña</label>
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required className="input" placeholder="Mínimo 8 caracteres" />
      </div>
      <label className="flex items-start gap-2 text-xs text-ink-soft">
        <input type="checkbox" name="terms" required className="mt-0.5 accent-gold" />
        <span>Acepto la <Link href="/legal/privacidad" target="_blank" className="link-gold">política de privacidad</Link>.</span>
      </label>
      <label className="flex items-start gap-2 text-xs text-ink-soft">
        <input type="checkbox" name="marketing" className="mt-0.5 accent-gold" />
        <span>Quiero recibir novedades y ediciones limitadas (opcional).</span>
      </label>
      <Msg state={state} />
      <button disabled={pending} className="btn-primary w-full">{pending ? "Creando cuenta…" : "Crear cuenta y obtener mi 5%"}</button>
    </Form>
  );
}

export function ResetRequestForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, null);
  if (state?.ok) return <Msg state={state} />;
  return (
    <Form action={action} className="space-y-4">
      <div>
        <label className="label" htmlFor="email">Email de tu cuenta</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="input" />
      </div>
      <Msg state={state} />
      <button disabled={pending} className="btn-primary w-full">Enviar enlace</button>
    </Form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPassword, null);
  return (
    <Form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <div>
        <label className="label" htmlFor="password">Nueva contraseña</label>
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required className="input" />
      </div>
      <Msg state={state} />
      <button disabled={pending} className="btn-primary w-full">Guardar contraseña</button>
    </Form>
  );
}

type Profile = { name: string; phone: string; address: string; postalCode: string; city: string; province: string };

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState(updateProfile, null);
  const field = (k: keyof Profile, label: string, auto?: string) => (
    <div>
      <label className="label" htmlFor={`p-${k}`}>{label}</label>
      <input id={`p-${k}`} name={k} defaultValue={profile[k]} autoComplete={auto} className="input" />
    </div>
  );
  return (
    <Form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {field("name", "Nombre", "name")}
        {field("phone", "Teléfono", "tel")}
        <div className="sm:col-span-2">{field("address", "Dirección", "street-address")}</div>
        {field("postalCode", "Código postal", "postal-code")}
        {field("city", "Ciudad", "address-level2")}
        {field("province", "Provincia", "address-level1")}
      </div>
      <Msg state={state} />
      <button disabled={pending} className="btn-outline">Guardar</button>
    </Form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, null);
  return (
    <Form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="current">Contraseña actual</label>
          <input id="current" name="current" type="password" autoComplete="current-password" required className="input" />
        </div>
        <div>
          <label className="label" htmlFor="next">Nueva contraseña</label>
          <input id="next" name="next" type="password" autoComplete="new-password" minLength={8} required className="input" />
        </div>
      </div>
      <Msg state={state} />
      <button disabled={pending} className="btn-outline">Cambiar contraseña</button>
    </Form>
  );
}
