import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import AuthShell from "@/components/layout/AuthShell";
import { LoginForm } from "@/components/forms/AuthForms";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getCurrentUser()) redirect(next?.startsWith("/") && !next.startsWith("//") ? next : "/cuenta");
  return (
    <AuthShell eyebrow="Bienvenido de nuevo" title="Iniciar sesión">
      <LoginForm next={next} />
      <p className="mt-6 text-center text-sm text-ink-soft">
        ¿No tienes cuenta? <Link href={`/registrarse${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="link-gold">Regístrate y ahorra un 5%</Link>
      </p>
      {next === "/checkout" && (
        <Link href="/checkout" className="btn-ghost mt-2 w-full text-xs uppercase tracking-widest">Continuar como invitado</Link>
      )}
    </AuthShell>
  );
}
