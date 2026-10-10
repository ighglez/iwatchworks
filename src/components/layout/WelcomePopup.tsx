"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "../cart/CartProvider";
import { CloseIcon, GiftIcon } from "../icons";

const KEY = "iw_welcome_seen";
const HIDDEN_ON = ["/checkout", "/iniciar-sesion", "/registrarse", "/cuenta", "/pedido", "/legal"];

/** Invitación discreta (no modal) que aparece una sola vez y nunca durante la compra. */
export default function WelcomePopup() {
  const { viewer, open } = useCart();
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (viewer.loggedIn || HIDDEN_ON.some((p) => pathname.startsWith(p))) return;
    try {
      if (localStorage.getItem(KEY)) return;
    } catch {
      return;
    }
    const t = setTimeout(() => setShow(true), 18000);
    return () => clearTimeout(t);
  }, [viewer.loggedIn, pathname]);

  const dismiss = () => {
    setShow(false);
    try {
      localStorage.setItem(KEY, "1");
    } catch {}
  };

  if (!show || open || HIDDEN_ON.some((p) => pathname.startsWith(p))) return null;

  return (
    <div role="dialog" aria-label="Ventaja de bienvenida" className="fixed bottom-4 left-4 right-4 z-40 animate-rise sm:left-6 sm:right-auto sm:max-w-sm">
      <div className="relative border border-gold-light bg-white p-6 shadow-soft">
        <button onClick={dismiss} className="absolute right-3 top-3 p-1 text-ink-muted hover:text-ink" aria-label="Cerrar">
          <CloseIcon className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-soft text-gold-dark">
            <GiftIcon />
          </span>
          <p className="eyebrow">Club IWatchWorks</p>
        </div>
        <p className="mt-4 font-serif text-2xl leading-snug">Un 5% de bienvenida en tu primer reloj</p>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Crea tu cuenta gratis y acumula puntos en cada compra: 100 puntos = 5 € de descuento. Registrarse es opcional.
        </p>
        <div className="mt-5 flex items-center gap-3">
          <Link href={`/registrarse?next=${encodeURIComponent(pathname)}`} onClick={dismiss} className="btn-gold px-5 py-2.5">
            Crear mi cuenta
          </Link>
          <button onClick={dismiss} className="text-xs uppercase tracking-widest text-ink-muted hover:text-ink">
            Ahora no
          </button>
        </div>
      </div>
    </div>
  );
}
