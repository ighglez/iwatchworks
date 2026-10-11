"use client";

import Form from "@/components/forms/Form";
import { useActionState, useState } from "react";
import { saveProduct } from "@/app/actions/admin";
import ImageManager from "./ImageManager";

type P = {
  id?: string; name: string; brand: string; reference: string; category: string; description: string;
  price: string; compareAtPrice: string; lowStockThreshold: number; featured: boolean; active: boolean;
  images: string[]; specs: string;
};

export default function ProductForm({ product, categories }: { product?: P; categories: string[] }) {
  const [state, action, pending] = useActionState(saveProduct, null);
  const [uploading, setUploading] = useState(false);
  const p: P = product ?? { name: "", brand: "Seiko", reference: "", category: "", description: "", price: "", compareAtPrice: "", lowStockThreshold: 2, featured: false, active: true, images: [], specs: "Movimiento: \nCaja: \nCristal: \nHermeticidad: \nCorrea: " };

  return (
    <Form action={action} className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
      {p.id && <input type="hidden" name="id" value={p.id} />}
      <div className="card space-y-5 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Marca" name="brand" defaultValue={p.brand} required />
          <Field label="Modelo" name="name" defaultValue={p.name} required placeholder="5 Sports GMT" />
          <Field label="Referencia" name="reference" defaultValue={p.reference} required placeholder="SSK001K1" />
          <div>
            <label className="label" htmlFor="category">Categoría</label>
            <input id="category" name="category" list="cats" defaultValue={p.category} required className="input" placeholder="GMT, Buceo, Cronógrafo…" />
            <datalist id="cats">{categories.map((c) => <option key={c} value={c} />)}</datalist>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="description">Descripción</label>
          <textarea id="description" name="description" rows={5} defaultValue={p.description} required className="input" />
        </div>
        <div>
          <label className="label" htmlFor="specs">Características <span className="normal-case tracking-normal text-ink-muted">(una por línea: Nombre: valor)</span></label>
          <textarea id="specs" name="specs" rows={6} defaultValue={p.specs} className="input font-mono text-xs" />
        </div>
        <ImageManager initial={p.images} onBusy={setUploading} />
      </div>

      <div className="space-y-6">
        <div className="card space-y-4 p-6">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Precio (€)" name="price" defaultValue={p.price} required inputMode="decimal" placeholder="349,00" />
            <Field label="Precio anterior (€)" name="compareAtPrice" defaultValue={p.compareAtPrice} inputMode="decimal" placeholder="Opcional" />
          </div>
          {!p.id && <Field label="Stock inicial" name="stock" type="number" defaultValue="1" min={0} />}
          <Field label="Avisar de stock bajo con" name="lowStockThreshold" type="number" defaultValue={String(p.lowStockThreshold)} min={0} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="featured" defaultChecked={p.featured} className="accent-gold" /> Destacado en la portada</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={p.active} className="accent-gold" /> Visible en la tienda</label>
        </div>
        {state?.error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{state.error}</p>}
        {state?.message && <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{state.message}</p>}
        <button disabled={pending || uploading} className="btn-primary w-full">{uploading ? "Subiendo fotos…" : pending ? "Guardando…" : p.id ? "Guardar cambios" : "Crear producto"}</button>
        {p.id && <p className="text-xs text-ink-muted">El stock se modifica desde Inventario para que quede registrado cada movimiento.</p>}
      </div>
    </Form>
  );
}

function Field({ label, name, ...rest }: { label: string; name: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      <input id={name} name={name} className="input" {...rest} />
    </div>
  );
}
