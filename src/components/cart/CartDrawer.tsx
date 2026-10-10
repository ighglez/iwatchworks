"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useCart } from "./CartProvider";
import { euros } from "@/lib/money";
import WatchImage from "../WatchImage";
import { CheckIcon, CloseIcon, GiftIcon, LockIcon, MinusIcon, PlusIcon, ReturnIcon, TrashIcon, TruckIcon } from "../icons";

export default function CartDrawer() {
  const { open, closeCart, items, subtotal, setQty, remove, lastAddedId, viewer, count } = useCart();
  const panel = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeCart();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.querySelector<HTMLElement>("a[href='/checkout'], button")?.focus();
    // Mantiene el foco dentro del panel mientras está abierto
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !panel.current) return;
      const f = panel.current.querySelectorAll<HTMLElement>("a, button:not([disabled]), input");
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", trap);
    return () => {
      document.removeEventListener("keydown", trap);
      previous?.focus?.();
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, closeCart]);

  if (!open) return null;
  const justAdded = items.find((i) => i.productId === lastAddedId);
  const savings = Math.round(subtotal * 0.05);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Tu carrito">
      <button aria-label="Cerrar carrito" onClick={closeCart} className="absolute inset-0 animate-fade-in bg-ink/40 backdrop-blur-[2px]" />
      <aside ref={panel} className="absolute right-0 top-0 flex h-full w-full max-w-md animate-slide-in flex-col bg-ivory shadow-2xl">
        <header className="flex items-center justify-between border-b border-line px-6 py-5">
          {justAdded ? (
            <p className="flex items-center gap-2 text-sm font-medium">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold text-white">
                <CheckIcon className="h-4 w-4" />
              </span>
              Añadido a tu carrito
            </p>
          ) : (
            <p className="font-serif text-2xl">Tu carrito {count > 0 && <span className="text-base text-ink-muted">({count})</span>}</p>
          )}
          <button onClick={closeCart} className="p-1 text-ink-soft hover:text-ink" aria-label="Cerrar">
            <CloseIcon />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="font-serif text-2xl">Tu carrito está vacío</p>
            <p className="text-sm text-ink-soft">Descubre nuestra selección de relojes automáticos japoneses.</p>
            <Link href="/tienda" onClick={closeCart} className="btn-primary mt-2">
              Ver tienda
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-6">
              {items.map((i) => (
                <li key={i.productId} className={`flex gap-4 py-5 ${i.productId === lastAddedId ? "animate-rise" : ""}`}>
                  <Link href={`/producto/${i.slug}`} onClick={closeCart} className="h-24 w-24 shrink-0 overflow-hidden border border-line bg-white">
                    <WatchImage src={i.image} alt={`${i.brand} ${i.name}`} sizes="100px" className="h-full w-full" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="eyebrow !tracking-[0.18em]">{i.brand}</p>
                    <Link href={`/producto/${i.slug}`} onClick={closeCart} className="truncate font-serif text-lg leading-tight hover:text-gold-dark">
                      {i.name}
                    </Link>
                    <p className="text-xs text-ink-muted">Ref. {i.reference}</p>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center border border-line bg-white">
                        <button className="p-1.5 disabled:opacity-30" onClick={() => setQty(i.productId, i.quantity - 1)} disabled={i.quantity <= 1} aria-label="Quitar una unidad">
                          <MinusIcon className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-7 text-center text-sm tabular-nums">{i.quantity}</span>
                        <button className="p-1.5 disabled:opacity-30" onClick={() => setQty(i.productId, i.quantity + 1)} disabled={i.quantity >= Math.min(5, i.stock)} aria-label="Añadir una unidad">
                          <PlusIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium tabular-nums">{euros(i.price * i.quantity)}</span>
                        <button onClick={() => remove(i.productId)} className="text-ink-muted hover:text-ink" aria-label="Eliminar">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <footer className="border-t border-line bg-white px-6 pb-6 pt-5">
              {!viewer.loggedIn && (
                <div className="mb-4 flex items-start gap-3 bg-gold-soft px-4 py-3 text-xs leading-relaxed text-ink-soft">
                  <GiftIcon className="mt-0.5 h-4 w-4 shrink-0 text-gold-dark" />
                  <p>
                    <span className="font-medium text-ink">¿Primera compra?</span> Crea tu cuenta al pagar y ahorra un 5% ({euros(savings)}). Es opcional.
                  </p>
                </div>
              )}
              {viewer.loggedIn && viewer.welcomeEligible && (
                <div className="mb-4 flex items-start gap-3 bg-gold-soft px-4 py-3 text-xs text-ink-soft">
                  <GiftIcon className="mt-0.5 h-4 w-4 shrink-0 text-gold-dark" />
                  <p>Tu 5% de bienvenida (−{euros(savings)}) se aplicará al finalizar.</p>
                </div>
              )}
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-ink-soft">Subtotal</span>
                <span className="font-serif text-2xl tabular-nums">{euros(subtotal)}</span>
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-emerald-700">
                <TruckIcon className="h-4 w-4" /> Envío asegurado gratuito · 24/72 h
              </p>
              <Link href="/checkout" onClick={closeCart} className="btn-primary mt-4 w-full py-4 text-base">
                <LockIcon className="h-4 w-4" /> Finalizar compra
              </Link>
              <button onClick={closeCart} className="btn-ghost mt-1 w-full text-xs uppercase tracking-widest">
                Seguir comprando
              </button>
              <div className="mt-3 flex items-center justify-center gap-4 text-[11px] text-ink-muted">
                <span className="flex items-center gap-1"><LockIcon className="h-3.5 w-3.5" /> Pago seguro</span>
                <span className="flex items-center gap-1"><ReturnIcon className="h-3.5 w-3.5" /> 14 días devolución</span>
              </div>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
