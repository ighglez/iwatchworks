"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const KEY = "iw_cookies_ok";

export default function CookieNotice() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {}
  }, []);
  if (!show) return null;
  return (
    <div className="fixed inset-x-3 bottom-3 z-30 animate-rise sm:inset-x-auto sm:right-5 sm:bottom-5 sm:max-w-sm" role="region" aria-label="Aviso de cookies">
      <div className="rounded-2xl border border-line bg-white/95 p-5 text-sm text-ink-soft shadow-soft backdrop-blur">
        <p>Solo usamos cookies técnicas para tu carrito, tu sesión y el pago seguro. Nada de publicidad. <Link href="/legal/cookies" className="link-gold">Más información</Link></p>
        <button
          onClick={() => {
            try { localStorage.setItem(KEY, "1"); } catch {}
            setShow(false);
          }}
          className="btn-primary mt-4 w-full py-2.5"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}
