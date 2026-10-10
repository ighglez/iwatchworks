import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getOrderForViewer } from "@/lib/order-access";
import { demoPaymentsEnabled } from "@/lib/stripe";
import { demoPay } from "@/app/actions/order";
import { euros } from "@/lib/money";
import { LockIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Pago", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function DemoPay({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (!demoPaymentsEnabled()) notFound();
  const sp = await searchParams;
  const order = await getOrderForViewer(sp.order ?? "", sp.t);
  if (!order || order.status !== "PENDING") notFound();

  return (
    <div className="container-x max-w-md py-14">
      <p className="mb-6 border border-amber-300 bg-amber-50 p-3 text-center text-xs text-amber-900">
        MODO DEMOSTRACIÓN · Aquí aparecerá la pasarela segura de Stripe. No se realizará ningún cargo.
      </p>
      <div className="card p-8">
        <p className="eyebrow">Pedido {order.number}</p>
        <p className="mt-2 font-serif text-4xl">{euros(order.total)}</p>
        <div className="mt-6 space-y-3 opacity-70">
          <input disabled className="input" value="4242 4242 4242 4242" readOnly aria-label="Tarjeta de prueba" />
          <div className="grid grid-cols-2 gap-3">
            <input disabled className="input" value="12 / 34" readOnly aria-label="Caducidad" />
            <input disabled className="input" value="123" readOnly aria-label="CVC" />
          </div>
        </div>
        <form action={demoPay} className="mt-6 space-y-2">
          <input type="hidden" name="order" value={order.number} />
          <input type="hidden" name="t" value={sp.t} />
          <button name="result" value="ok" className="btn-primary w-full py-4"><LockIcon className="h-4 w-4" /> Simular pago correcto</button>
          <button name="result" value="cancel" className="btn-ghost w-full text-xs uppercase tracking-widest">Cancelar y volver</button>
        </form>
      </div>
    </div>
  );
}
