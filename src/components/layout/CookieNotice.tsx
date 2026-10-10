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
    <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-line bg-white/95 backdrop-blur">
      <div className="container-x flex flex-col items-start gap-3 py-3 text-xs text-ink-soft sm:flex-row sm:items-center sm:justify-between">
        <p>
          Solo usamos cookies técnicas necesarias para el carrito, el inicio de sesión y el pago seguro. No usamos cookies publicitarias.{" "}
          <Link href="/legal/cookies" className="link-gold">Más información</Link>
        </p>
        <button
          onClick={() => {
            try { localStorage.setItem(KEY, "1"); } catch {}
            setShow(false);
          }}
          className="btn-outline shrink-0 px-4 py-2 text-xs"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}
