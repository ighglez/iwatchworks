import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import AuthShell from "@/components/layout/AuthShell";
import { RegisterForm } from "@/components/forms/AuthForms";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Crear cuenta" };

export default async function Register({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getCurrentUser()) redirect("/cuenta");
  return (
    <AuthShell eyebrow="Únete gratis" title="Crear cuenta">
      <RegisterForm next={next} />
      <p className="mt-6 text-center text-sm text-ink-soft">
        ¿Ya tienes cuenta? <Link href={`/iniciar-sesion${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="link-gold">Inicia sesión</Link>
      </p>
    </AuthShell>
  );
}
