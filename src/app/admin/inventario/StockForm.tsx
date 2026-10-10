"use client";

import { useActionState } from "react";
import { adjustStock } from "@/app/actions/admin";
import Form from "@/components/forms/Form";

export default function StockForm({ products, selected }: { products: { id: string; label: string; stock: number }[]; selected?: string }) {
  const [state, action, pending] = useActionState(adjustStock, null);
  return (
    <Form action={action} className="card grid gap-4 p-6 md:grid-cols-[2fr_1fr_1fr_1.2fr_auto] md:items-end">
      <div>
        <label className="label" htmlFor="productId">Producto</label>
        <select id="productId" name="productId" defaultValue={selected} className="input py-2.5">
          {products.map((p) => <option key={p.id} value={p.id}>{p.label} ({p.stock} uds.)</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="mode">Operación</label>
        <select id="mode" name="mode" className="input py-2.5">
          <option value="add">Sumar / restar</option>
          <option value="set">Fijar stock en</option>
        </select>
      </div>
      <div>
        <label className="label" htmlFor="qty">Cantidad</label>
        <input id="qty" name="qty" type="number" required defaultValue={1} className="input py-2.5" />
      </div>
      <div>
        <label className="label" htmlFor="reason">Motivo</label>
        <select id="reason" name="reason" className="input py-2.5">
          <option value="RESTOCK">Entrada de mercancía</option>
          <option value="ADJUSTMENT">Ajuste / recuento</option>
          <option value="RETURN">Devolución</option>
        </select>
      </div>
      <button disabled={pending} className="btn-primary py-3">Aplicar</button>
      <input name="note" placeholder="Nota opcional (proveedor, albarán…)" className="input py-2 md:col-span-4" aria-label="Nota" />
      <div className="text-sm md:col-span-1">
        {state?.error && <span className="text-rose-700">{state.error}</span>}
        {state?.message && <span className="text-emerald-700">{state.message}</span>}
      </div>
    </Form>
  );
}
