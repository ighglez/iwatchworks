"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "../cart/CartProvider";
import { BagIcon, CloseIcon, MenuIcon, UserIcon } from "../icons";

const NAV = [
  { href: "/tienda", label: "Colección" },
  { href: "/tienda?categoria=GMT", label: "GMT" },
  { href: "/tienda?categoria=Cronógrafo", label: "Cronógrafos" },
  { href: "/#servicio", label: "Servicio" },
];

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex flex-col items-center leading-none ${className}`}>
      <svg viewBox="0 0 24 12" className="mb-1 h-2.5 w-5 text-gold" fill="currentColor" aria-hidden="true">
        <path d="M2 11 0 2l6 4 6-6 6 6 6-4-2 9H2Z" />
      </svg>
      <span className="text-[15px] font-semibold tracking-[0.32em] sm:text-[17px]">IWATCHWORKS</span>
    </span>
  );
}

export default function Header({ isAdmin }: { isAdmin: boolean }) {
  const { count, openCart, viewer, ready } = useCart();
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const overlay = pathname === "/" && !scrolled && !menu;

  useEffect(() => setMenu(false), [pathname]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <>
      <header
        className={`${pathname === "/" ? "fixed" : "sticky"} inset-x-0 top-0 z-40 transition-colors duration-500 ${
          overlay ? "bg-transparent text-white" : "border-b border-line/70 bg-ivory/90 text-ink backdrop-blur-xl"
        }`}
      >
        <div className="container-x grid h-16 grid-cols-[1fr_auto_1fr] items-center md:h-[76px]">
          <div className="flex items-center gap-8">
            <button className="-ml-2 flex items-center gap-2 p-2 lg:hidden" onClick={() => setMenu(true)} aria-label="Abrir menú">
              <MenuIcon />
              <span className="hidden text-sm sm:inline">Menú</span>
            </button>
            <nav className="hidden items-center gap-8 lg:flex" aria-label="Principal">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className="text-[13px] font-medium opacity-80 transition hover:opacity-100">
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>

          <Link href="/" aria-label="IWatchWorks, inicio">
            <Wordmark />
          </Link>

          <div className="flex items-center justify-end gap-1 sm:gap-2">
            {isAdmin && (
              <Link href="/admin" className={`hidden rounded-full border px-3 py-1.5 text-[11px] font-medium sm:inline-flex ${overlay ? "border-white/40" : "border-gold text-gold-dark"}`}>
                Admin
              </Link>
            )}
            <Link href={viewer.loggedIn ? "/cuenta" : "/iniciar-sesion"} className="flex items-center gap-2 p-2 opacity-85 hover:opacity-100" aria-label={viewer.loggedIn ? "Mi cuenta" : "Iniciar sesión"}>
              <UserIcon />
              <span className="hidden text-[13px] font-medium xl:inline">{viewer.loggedIn ? viewer.name?.split(" ")[0] : "Acceder"}</span>
            </Link>
            <button onClick={openCart} className="relative p-2 opacity-85 hover:opacity-100" aria-label={`Carrito, ${count} artículos`}>
              <BagIcon className="h-[22px] w-[22px]" />
              {ready && count > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-gold px-1 text-[10px] font-semibold text-ink">{count}</span>
              )}
            </button>
          </div>
        </div>
      </header>

      {menu && (
        <div className="fixed inset-0 z-50 animate-fade-in bg-night text-ivory lg:hidden" role="dialog" aria-modal="true" aria-label="Menú">
          <div className="container-x flex h-16 items-center justify-between">
            <button onClick={() => setMenu(false)} className="-ml-2 flex items-center gap-2 p-2" aria-label="Cerrar menú">
              <CloseIcon /> <span className="text-sm">Cerrar</span>
            </button>
            <Wordmark />
            <span className="w-16" />
          </div>
          <nav className="container-x mt-10">
            <ul className="space-y-6">
              {[{ href: "/", label: "Inicio" }, ...NAV, { href: "/#contacto", label: "Contacto" }].map((n, i) => (
                <li key={n.href} className="animate-rise" style={{ animationDelay: `${i * 50}ms` }}>
                  <Link href={n.href} className="text-3xl font-semibold tracking-tight">{n.label}</Link>
                </li>
              ))}
            </ul>
            <div className="mt-12 flex flex-col gap-4 border-t border-night-line pt-8 text-sm text-ivory/70">
              <Link href={viewer.loggedIn ? "/cuenta" : "/iniciar-sesion"}>{viewer.loggedIn ? "Mi cuenta" : "Acceder o crear cuenta"}</Link>
              <Link href="/seguimiento">Seguir mi pedido</Link>
              {isAdmin && <Link href="/admin" className="text-gold">Panel de administración</Link>}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
