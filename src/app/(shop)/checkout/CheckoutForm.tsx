"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import { placeOrder } from "@/app/actions/checkout";
import { useCart } from "@/components/cart/CartProvider";
import type { PublicProduct } from "@/lib/product";
import { euros } from "@/lib/money";
import WatchImage from "@/components/WatchImage";
import { BoltIcon, CheckIcon, GiftIcon, LockIcon, ReturnIcon, ShieldIcon, TruckIcon } from "@/components/icons";

type UserInfo = {
  email: string; name: string; phone: string; address: string; city: string; postalCode: string; province: string;
  points: number; welcomeEligible: boolean;
} | null;

type Quote = {
  lines: { productId: string; slug: string; name: string; brand: string; reference: string; image: string | null; art: string; price: number; quantity: number; lineTotal: number }[];
  issues: string[];
  subtotal: number; welcomeDiscount: number; pointsDiscount: number; pointsRedeemed: number; pointsMaxRedeemable: number;
  pointsAvailable: number; shipping: number; total: number; pointsToEarn: number; welcomeEligible: boolean;
};

const PROVINCES = ["A Coruña","Álava","Albacete","Alicante","Almería","Asturias","Ávila","Badajoz","Baleares","Barcelona","Burgos","Cáceres","Cádiz","Cantabria","Castellón","Ceuta","Ciudad Real","Córdoba","Cuenca","Girona","Granada","Guadalajara","Guipúzcoa","Huelva","Huesca","Jaén","La Rioja","Las Palmas","León","Lleida","Lugo","Madrid","Málaga","Melilla","Murcia","Navarra","Ourense","Palencia","Pontevedra","Salamanca","Santa Cruz de Tenerife","Segovia","Sevilla","Soria","Tarragona","Teruel","Toledo","Valencia","Valladolid","Vizcaya","Zamora","Zaragoza"];

export default function CheckoutForm({ user, buyNow, cancelled, transferDays }: { user: UserInfo; buyNow: PublicProduct | null; cancelled: boolean; transferDays: number }) {
  const transfer = transferDays > 0;
  const cart = useCart();
  const [state, action, pending] = useActionState(placeOrder, null);
  const [createAccount, setCreateAccount] = useState(false);
  const [usePoints, setUsePoints] = useState(false);
  const [terms, setTerms] = useState(false);
  const [saveAddress, setSaveAddress] = useState(true);
  const [q, setQ] = useState<Quote | null>(null);
  const [f, setF] = useState({
    email: user?.email ?? "", name: user?.name ?? "", phone: user?.phone ?? "", address: user?.address ?? "",
    postalCode: user?.postalCode ?? "", city: user?.city ?? "", province: user?.province ?? "", notes: "", password: "",
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF((s) => ({ ...s, [k]: e.target.value }));

  const items = useMemo(
    () => (buyNow ? [{ productId: buyNow.id, quantity: 1 }] : cart.items.map((i) => ({ productId: i.productId, quantity: i.quantity }))),
    [buyNow, cart.items],
  );
  const itemsKey = JSON.stringify(items);

  useEffect(() => {
    if (!cart.ready || items.length === 0) return;
    const ctrl = new AbortController();
    fetch("/api/cart/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, usePoints, welcome: !user && createAccount }),
      signal: ctrl.signal,
    })
      .then((r) => r.json())
      .then(setQ)
      .catch(() => {});
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey, usePoints, createAccount, cart.ready, user]);

  const fe = state?.fieldErrors ?? {};
  const err = (k: string) => fe[k] && <p className="mt-1 text-xs text-rose-700">{fe[k]}</p>;
  const inputCls = (k: string) => `input ${fe[k] ? "border-rose-400" : ""}`;

  if (cart.ready && items.length === 0) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-4xl">Tu carrito está vacío</h1>
        <p className="mt-3 text-ink-soft">Añade un reloj para continuar con la compra.</p>
        <Link href="/tienda" className="btn-primary mt-8">Ver tienda</Link>
      </div>
    );
  }

  const welcomeSaving = q ? Math.round(q.subtotal * 0.05) : 0;
  const pointsPossible = user && q ? q.pointsMaxRedeemable : 0;

  return (
    <>
      <Steps transfer={transfer} />
      <h1 className="sr-only">Finalizar compra</h1>
      {cancelled && (
        <p className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          El pago se canceló y no se ha realizado ningún cargo. Puedes intentarlo de nuevo cuando quieras.
        </p>
      )}
      <form action={action} className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-14" noValidate>
        <input type="hidden" name="items" value={itemsKey} />
        <div className="space-y-10">
          {/* CONTACTO */}
          <section>
            <div className="flex items-baseline justify-between">
              <h2 className="text-3xl">Contacto</h2>
              {!user && (
                <Link href="/iniciar-sesion?next=/checkout" className="text-sm link-gold">¿Ya tienes cuenta? Inicia sesión</Link>
              )}
            </div>
            <div className="mt-5">
              <label className="label" htmlFor="email">Email</label>
              <input id="email" name="email" type="email" autoComplete="email" required className={inputCls("email")} value={f.email} onChange={set("email")} readOnly={!!user} />
              {err("email")}
              <p className="mt-1.5 text-xs text-ink-muted">Te enviaremos la confirmación y el seguimiento del envío.</p>
            </div>
          </section>

          {/* ENVÍO */}
          <section>
            <h2 className="text-3xl">Envío</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label" htmlFor="name">Nombre y apellidos</label>
                <input id="name" name="name" autoComplete="name" required className={inputCls("name")} value={f.name} onChange={set("name")} />
                {err("name")}
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="address">Dirección</label>
                <input id="address" name="address" autoComplete="street-address" required placeholder="Calle, número, piso" className={inputCls("address")} value={f.address} onChange={set("address")} />
                {err("address")}
              </div>
              <div>
                <label className="label" htmlFor="postalCode">Código postal</label>
                <input id="postalCode" name="postalCode" autoComplete="postal-code" inputMode="numeric" maxLength={5} required className={inputCls("postalCode")} value={f.postalCode} onChange={set("postalCode")} />
                {err("postalCode")}
              </div>
              <div>
                <label className="label" htmlFor="city">Ciudad</label>
                <input id="city" name="city" autoComplete="address-level2" required className={inputCls("city")} value={f.city} onChange={set("city")} />
                {err("city")}
              </div>
              <div>
                <label className="label" htmlFor="province">Provincia</label>
                <select id="province" name="province" autoComplete="address-level1" required className={inputCls("province")} value={f.province} onChange={set("province")}>
                  <option value="">Selecciona…</option>
                  {PROVINCES.map((p) => <option key={p}>{p}</option>)}
                </select>
                {err("province")}
              </div>
              <div>
                <label className="label" htmlFor="phone">Teléfono</label>
                <input id="phone" name="phone" type="tel" autoComplete="tel" required placeholder="Para el repartidor" className={inputCls("phone")} value={f.phone} onChange={set("phone")} />
                {err("phone")}
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="notes">Notas para el pedido <span className="normal-case tracking-normal text-ink-muted">(opcional)</span></label>
                <textarea id="notes" name="notes" rows={2} className="input resize-none" value={f.notes} onChange={set("notes")} placeholder="Ej.: es un regalo, horario de entrega…" />
              </div>
              {user && (
                <label className="flex items-center gap-2 text-sm text-ink-soft sm:col-span-2">
                  <input type="checkbox" name="saveAddress" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} className="accent-gold" /> Guardar esta dirección en mi cuenta
                </label>
              )}
            </div>
            <p className="mt-4 flex items-center gap-2 text-sm text-emerald-700">
              <TruckIcon className="h-4 w-4" /> Envío asegurado gratuito a España peninsular y Baleares · 24/72 h
            </p>
          </section>

          {/* VENTAJAS */}
          {!user && (
            <section className={`border p-5 transition ${createAccount ? "border-gold bg-gold-soft/60" : "border-line bg-white"}`}>
              <label className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" name="createAccount" checked={createAccount} onChange={(e) => setCreateAccount(e.target.checked)} className="mt-1 h-4 w-4 accent-gold" />
                <span>
                  <span className="flex items-center gap-2 font-medium">
                    <GiftIcon className="h-4 w-4 text-gold-dark" /> Crear cuenta y ahorrar un 5%{welcomeSaving > 0 && <> ({euros(welcomeSaving)})</>}
                  </span>
                  <span className="mt-1 block text-sm text-ink-soft">
                    Opcional. Además sumarás {q?.subtotal ? Math.floor((q.subtotal - welcomeSaving) / 100) : "tus"} puntos con este pedido para futuras compras.
                  </span>
                </span>
              </label>
              {createAccount && (
                <div className="mt-4 animate-rise pl-7">
                  <label className="label" htmlFor="password">Elige una contraseña</label>
                  <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} className={inputCls("password")} value={f.password} onChange={set("password")} placeholder="Mínimo 8 caracteres" />
                  {err("password")}
                </div>
              )}
            </section>
          )}

          {user && (
            <section className="rounded-2xl border border-line bg-white p-5">
              <p className="flex items-center gap-2 font-medium"><GiftIcon className="h-4 w-4 text-gold-dark" /> Tus ventajas</p>
              {user.welcomeEligible && <p className="mt-2 flex items-center gap-2 text-sm text-emerald-700"><CheckIcon className="h-4 w-4" /> 5% de bienvenida aplicado</p>}
              <p className="mt-2 text-sm text-ink-soft">Tienes <b className="text-ink">{user.points} puntos</b>.</p>
              {pointsPossible > 0 ? (
                <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm">
                  <input type="checkbox" name="usePoints" checked={usePoints} onChange={(e) => setUsePoints(e.target.checked)} className="h-4 w-4 accent-gold" />
                  Usar {pointsPossible} puntos y ahorrar {euros((pointsPossible / 100) * 500)}
                </label>
              ) : (
                <p className="mt-1 text-xs text-ink-muted">Con 100 puntos podrás canjear 5 € en tu próxima compra.</p>
              )}
            </section>
          )}
        </div>

        {/* RESUMEN */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="card p-6 md:p-8">
            <div className="flex items-baseline justify-between">
              <h2 className="text-3xl">Resumen</h2>
              {buyNow ? (
                <span className="flex items-center gap-1 text-xs uppercase tracking-widest text-gold-dark"><BoltIcon className="h-3.5 w-3.5" /> Compra rápida</span>
              ) : (
                <button type="button" onClick={cart.openCart} className="text-xs link-gold">Editar carrito</button>
              )}
            </div>

            {!q ? (
              <div className="mt-6 space-y-3">
                <div className="h-20 animate-pulse bg-ivory-dark" />
                <div className="h-6 animate-pulse bg-ivory-dark" />
              </div>
            ) : (
              <>
                <ul className="mt-6 divide-y divide-line">
                  {q.lines.map((l) => (
                    <li key={l.productId} className="flex gap-4 py-4">
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-stone">
                        <WatchImage src={l.image} art={l.art} alt={l.name} sizes="100px" className="h-full w-full" />
                        <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[10px] text-ivory">{l.quantity}</span>
                      </div>
                      <div className="flex-1">
                        <p className="eyebrow !tracking-[0.15em]">{l.brand}</p>
                        <p className="font-display text-lg leading-tight">{l.name}</p>
                        <p className="text-xs text-ink-muted">Ref. {l.reference}</p>
                      </div>
                      <p className="text-sm tabular-nums">{euros(l.lineTotal)}</p>
                    </li>
                  ))}
                </ul>
                {q.issues.length > 0 && <p className="mt-2 bg-amber-50 p-3 text-xs text-amber-900">{q.issues.join(" ")}</p>}
                <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
                  <Row label="Subtotal" value={euros(q.subtotal)} />
                  {q.welcomeDiscount > 0 && <Row label="Bienvenida 5%" value={`−${euros(q.welcomeDiscount)}`} accent />}
                  {q.pointsDiscount > 0 && <Row label={`${q.pointsRedeemed} puntos`} value={`−${euros(q.pointsDiscount)}`} accent />}
                  <Row label="Envío asegurado" value={q.shipping ? euros(q.shipping) : "Gratis"} accent={!q.shipping} />
                </dl>
                <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
                  <span>Total <span className="text-xs text-ink-muted">IVA incl.</span></span>
                  <span className="font-display text-4xl tabular-nums">{euros(q.total)}</span>
                </div>
                {(user || createAccount) && q.pointsToEarn > 0 && (
                  <p className="mt-2 text-right text-xs text-gold-dark">Sumarás {q.pointsToEarn} puntos con esta compra</p>
                )}
              </>
            )}

            {transfer && (
              <div className="mt-6 rounded-2xl border border-gold bg-gold-soft/50 p-4">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full border-[5px] border-gold bg-white" aria-hidden="true" />
                  Transferencia bancaria
                </p>
                <p className="mt-1.5 pl-6 text-xs leading-relaxed text-ink-soft">
                  Al confirmar verás los datos de nuestra cuenta y te los enviamos por email. Tu reloj queda reservado {transferDays} días mientras haces el ingreso.
                </p>
              </div>
            )}

            <label className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-ink-soft">
              <input type="checkbox" name="terms" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-0.5 h-4 w-4 accent-gold" />
              <span>He leído y acepto las <Link href="/legal/condiciones" target="_blank" className="link-gold">condiciones de venta</Link> y la <Link href="/legal/privacidad" target="_blank" className="link-gold">política de privacidad</Link>.</span>
            </label>
            {err("terms")}

            {state?.error && <p role="alert" className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{state.error}</p>}

            <button disabled={pending || !q || q.lines.length === 0} className="btn-primary mt-5 w-full py-4 text-base">
              <LockIcon className="h-4 w-4" />
              {transfer
                ? pending ? "Confirmando tu pedido…" : q ? `Confirmar pedido · ${euros(q.total)}` : "Confirmar pedido"
                : pending ? "Conectando con el pago seguro…" : q ? `Pagar ${euros(q.total)}` : "Pagar"}
            </button>
            <p className="mt-3 text-center text-xs text-ink-muted">
              {transfer ? "Sin pagos con tarjeta: pagarás con una transferencia desde tu banco." : "Serás redirigido a la pasarela segura. Tarjeta, Apple Pay o Google Pay."}
            </p>

            <ul className="mt-6 grid grid-cols-3 gap-2 border-t border-line pt-5 text-center text-[11px] text-ink-soft">
              <li><ShieldIcon className="mx-auto mb-1 h-5 w-5 text-gold-dark" />100% original</li>
              <li><TruckIcon className="mx-auto mb-1 h-5 w-5 text-gold-dark" />Envío asegurado</li>
              <li><ReturnIcon className="mx-auto mb-1 h-5 w-5 text-gold-dark" />14 días devolución</li>
            </ul>
          </div>
        </aside>
      </form>
    </>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className="text-ink-soft">{label}</dt>
      <dd className={`tabular-nums ${accent ? "text-emerald-700" : ""}`}>{value}</dd>
    </div>
  );
}

function Steps({ transfer }: { transfer: boolean }) {
  const steps = ["Carrito", "Datos y envío", transfer ? "Confirmar pedido" : "Pago seguro", transfer ? "Transferencia" : "Confirmación"];
  return (
    <ol className="mb-10 flex items-center justify-center gap-2 text-[11px] uppercase tracking-widest sm:gap-4">
      {steps.map((s, i) => (
        <li key={s} className="flex items-center gap-2 sm:gap-4">
          <span className={`flex items-center gap-2 ${i === 1 ? "text-ink" : i < 1 ? "text-gold-dark" : "text-ink-muted"}`}>
            <span className={`flex h-6 w-6 items-center justify-center rounded-full border text-[10px] ${i === 1 ? "border-gold bg-gold text-white" : i < 1 ? "border-gold bg-gold-soft text-gold" : "border-line"}`}>
              {i < 1 ? <CheckIcon className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <span className="hidden sm:inline">{s}</span>
          </span>
          {i < steps.length - 1 && <span className="h-px w-6 bg-line sm:w-10" />}
        </li>
      ))}
    </ol>
  );
}
