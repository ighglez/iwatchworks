"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "../cart/CartProvider";
import { RULES } from "@/lib/config";
import { CloseIcon } from "../icons";

const KEY = "iw_welcome_seen";
const HIDDEN_ON = ["/checkout", "/iniciar-sesion", "/registrarse", "/cuenta", "/pedido", "/legal", "/recuperar", "/seguimiento"];

/** Invitación discreta que aparece una sola vez, nunca durante la compra ni encima del carrito. */
export default function WelcomePopup() {
  const { viewer, open } = useCart();
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  const hidden = HIDDEN_ON.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (viewer.loggedIn || hidden) return;
    try {
      if (localStorage.getItem(KEY) || !localStorage.getItem("iw_cookies_ok")) return;
    } catch {
      return;
    }
    const t = setTimeout(() => setShow(true), 20000);
    return () => clearTimeout(t);
  }, [viewer.loggedIn, hidden, pathname]);

  const dismiss = () => {
    setShow(false);
    try {
      localStorage.setItem(KEY, "1");
    } catch {}
  };

  if (!show || open || hidden) return null;

  return (
    <div role="dialog" aria-label="Club IWatchWorks" className="fixed inset-x-3 bottom-3 z-40 animate-rise sm:inset-x-auto sm:bottom-6 sm:left-6 sm:max-w-[360px]">
      <div className="relative overflow-hidden rounded-3xl bg-night p-7 text-ivory shadow-soft">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gold/25 blur-3xl" aria-hidden="true" />
        <button onClick={dismiss} className="absolute right-4 top-4 rounded-full p-1.5 text-ivory/60 hover:bg-white/10 hover:text-ivory" aria-label="Cerrar">
          <CloseIcon className="h-4 w-4" />
        </button>
        <p className="eyebrow-light">Club IWatchWorks</p>
        <p className="mt-4 text-2xl font-semibold leading-tight tracking-tight">Tu primer reloj, con un {RULES.welcomeDiscountPercent}% menos.</p>
        <p className="mt-3 text-sm leading-relaxed text-ivory/65">Cuenta gratuita, puntos en cada compra y pago más rápido. Si prefieres comprar como invitado, también puedes.</p>
        <div className="mt-6 flex items-center gap-4">
          <Link href={`/registrarse?next=${encodeURIComponent(pathname)}`} onClick={dismiss} className="btn-gold px-6 py-3">Crear mi cuenta</Link>
          <button onClick={dismiss} className="text-sm text-ivory/60 hover:text-ivory">Ahora no</button>
        </div>
      </div>
    </div>
  );
}
