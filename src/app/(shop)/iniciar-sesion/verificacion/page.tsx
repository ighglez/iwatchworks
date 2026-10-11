import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AuthShell from "@/components/layout/AuthShell";
import { TwoFactorForm } from "@/components/forms/AuthForms";

export const metadata: Metadata = { title: "Verificación", robots: { index: false } };

export default async function Verificacion() {
  if (!(await cookies()).has("iw_2fa")) redirect("/iniciar-sesion");
  return (
    <AuthShell eyebrow="Verificación en dos pasos" title="Introduce tu código">
      <p className="-mt-4 mb-6 text-sm text-ink-soft">Abre tu app de autenticación (Google Authenticator, Microsoft Authenticator…) y escribe el código de IWatchWorks.</p>
      <TwoFactorForm />
      <p className="mt-6 text-center text-sm text-ink-soft"><Link href="/iniciar-sesion" className="link-gold">Volver a iniciar sesión</Link></p>
    </AuthShell>
  );
}
