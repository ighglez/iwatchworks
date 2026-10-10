import type { Metadata } from "next";
import { ResetRequestForm } from "@/components/forms/AuthForms";

export const metadata: Metadata = { title: "Recuperar contraseña" };

export default function Recuperar() {
  return (
    <div className="container-x max-w-md py-16">
      <h1 className="text-center text-4xl">Recuperar contraseña</h1>
      <div className="card mt-8 p-8"><ResetRequestForm /></div>
    </div>
  );
}
