"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "../cart/CartProvider";
import { euros } from "@/lib/money";
import { BagIcon, CloseIcon, MenuIcon, UserIcon } from "../icons";

const NAV = [
  { href: "/", label: "Inicio" },
  { href: "/tienda", label: "Tienda" },
  { href: "/#confianza", label: "Confianza" },
  { href: "/#resenas", label: "Reseñas" },
  { href: "/#contacto", label: "Contacto" },
];

export default function Header({ isAdmin }: { isAdmin: boolean }) {
  const { count, subtotal, openCart, viewer, ready } = useCart();
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => setMenu(false), [pathname]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <>
      <div className="bg-ink text-center text-[11px] tracking-[0.2em] text-ivory/90">
        <p className="container-x py-2 uppercase">
          Envío asegurado gratuito <span className="mx-2 text-gold">·</span> Autenticidad garantizada
          <span className="hidden sm:inline"><span className="mx-2 text-gold">·</span> Factura en cada pedido</span>
        </p>
      </div>
      <header className={`sticky top-0 z-40 border-b transition-colors ${scrolled ? "border-line bg-ivory/95 backdrop-blur" : "border-transparent bg-ivory"}`}>
        <div className="container-x flex h-16 items-center justify-between gap-4 md:h-20">
          <button className="-ml-2 p-2 md:hidden" onClick={() => setMenu(true)} aria-label="Abrir menú">
            <MenuIcon />
          </button>
          <Link href="/" className="font-serif text-2xl tracking-wide md:text-[28px]">
            IWatch<span className="text-gold-dark">Works</span>
          </Link>
          <nav className="hidden items-center gap-8 md:flex" aria-label="Principal">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className={`text-[13px] uppercase tracking-[0.18em] transition hover:text-gold-dark ${pathname === n.href ? "text-gold-dark" : "text-ink-soft"}`}>
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-1 sm:gap-3">
            {isAdmin && (
              <Link href="/admin" className="hidden border border-gold px-3 py-1.5 text-[11px] uppercase tracking-widest text-gold-dark hover:bg-gold hover:text-white sm:inline-flex">
                Admin
              </Link>
            )}
            <Link
              href={viewer.loggedIn ? "/cuenta" : "/iniciar-sesion"}
              className="flex items-center gap-2 p-2 text-ink-soft hover:text-ink"
              aria-label={viewer.loggedIn ? "Mi cuenta" : "Iniciar sesión"}
            >
              <UserIcon />
              <span className="hidden text-xs lg:inline">{viewer.loggedIn ? `Hola, ${viewer.name?.split(" ")[0]}` : "Iniciar sesión"}</span>
            </Link>
            <button onClick={openCart} className="relative flex items-center gap-2 p-2 hover:text-gold-dark" aria-label={`Carrito, ${count} artículos`}>
              <BagIcon className="h-6 w-6" />
              {ready && count > 0 && (
                <span className="absolute right-0 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gold px-1 text-[10px] font-semibold text-ink sm:right-auto sm:left-6">
                  {count}
                </span>
              )}
              <span className="hidden text-sm tabular-nums sm:inline">{euros(ready ? subtotal : 0)}</span>
            </button>
          </div>
        </div>
      </header>

      {menu && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <button className="absolute inset-0 bg-ink/40" onClick={() => setMenu(false)} aria-label="Cerrar menú" />
          <nav className="absolute left-0 top-0 h-full w-72 animate-fade-in bg-ivory p-6 shadow-xl">
            <div className="mb-8 flex items-center justify-between">
              <span className="font-serif text-2xl">IWatch<span className="text-gold-dark">Works</span></span>
              <button onClick={() => setMenu(false)} aria-label="Cerrar"><CloseIcon /></button>
            </div>
            <ul className="space-y-5">
              {NAV.map((n) => (
                <li key={n.href}><Link href={n.href} className="font-serif text-2xl">{n.label}</Link></li>
              ))}
              <li className="border-t border-line pt-5">
                <Link href={viewer.loggedIn ? "/cuenta" : "/iniciar-sesion"} className="text-sm uppercase tracking-widest text-ink-soft">
                  {viewer.loggedIn ? "Mi cuenta" : "Iniciar sesión"}
                </Link>
              </li>
              {isAdmin && <li><Link href="/admin" className="text-sm uppercase tracking-widest text-gold-dark">Panel admin</Link></li>}
            </ul>
          </nav>
        </div>
      )}
    </>
  );
}
