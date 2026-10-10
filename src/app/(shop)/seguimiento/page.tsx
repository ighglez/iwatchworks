import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const metadata: Metadata = { title: "Seguir mi pedido" };

async function lookup(form: FormData) {
  "use server";
  const number = z.string().trim().toUpperCase().max(30).parse(form.get("number") ?? "");
  const email = z.string().trim().toLowerCase().max(200).parse(form.get("email") ?? "");
  if (!(await rateLimit(`track:${await clientIp()}`, 10, 600))) redirect("/seguimiento?e=limit");
  const order = await db.order.findUnique({ where: { number } });
  if (!order || order.email !== email) redirect("/seguimiento?e=1");
  redirect(`/pedido/${order.number}?t=${order.accessToken}`);
}

export default async function Seguimiento({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const { e } = await searchParams;
  return (
    <div className="container-x max-w-md py-16">
      <p className="eyebrow text-center">Seguimiento</p>
      <h1 className="mt-3 text-center text-4xl">Seguir mi pedido</h1>
      <form action={lookup} className="card mt-8 space-y-4 p-8">
        <div>
          <label className="label" htmlFor="number">Número de pedido</label>
          <input id="number" name="number" required placeholder="IW-…" className="input uppercase" />
        </div>
        <div>
          <label className="label" htmlFor="email">Email de la compra</label>
          <input id="email" name="email" type="email" required className="input" />
        </div>
        {e && <p className="text-sm text-rose-700">{e === "limit" ? "Demasiados intentos. Prueba más tarde." : "No encontramos un pedido con esos datos."}</p>}
        <button className="btn-primary w-full">Ver pedido</button>
      </form>
    </div>
  );
}
