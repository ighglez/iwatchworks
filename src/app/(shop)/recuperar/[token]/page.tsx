import type { Metadata } from "next";
import { ResetForm } from "@/components/forms/AuthForms";

export const metadata: Metadata = { title: "Nueva contraseña", robots: { index: false } };

export default async function NuevaPassword({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <div className="container-x max-w-md py-16">
      <h1 className="text-center text-4xl">Elige una nueva contraseña</h1>
      <div className="card mt-8 p-8"><ResetForm token={token} /></div>
    </div>
  );
}
