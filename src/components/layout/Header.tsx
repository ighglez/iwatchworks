"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCart } from "../cart/CartProvider";
import WatchImage from "../WatchImage";
import { euros } from "@/lib/money";
import { ArrowIcon, BagIcon, CloseIcon, MenuIcon, SearchIcon, UserIcon } from "../icons";

const NAV = [
  { href: "/tienda", label: "Todos los relojes" },
  { href: "/tienda?categoria=GMT", label: "GMT" },
  { href: "/tienda?categoria=Cronógrafo", label: "Cronógrafos" },
  { href: "/tienda?disponibles=1", label: "Disponibles hoy" },
];
const MORE = [
  { href: "/#servicio", label: "Nuestro servicio" },
  { href: "/#preguntas", label: "Preguntas frecuentes" },
  { href: "/#contacto", label: "Contacto" },
  { href: "/seguimiento", label: "Seguir mi pedido" },
];
const SUGGESTED = [
  { href: "/tienda?categoria=GMT", label: "GMT" },
  { href: "/tienda?categoria=Cronógrafo", label: "Cronógrafos" },
  { href: "/tienda?disponibles=1", label: "Disponibles hoy" },
  { href: "/tienda?orden=precio-asc", label: "Menor precio" },
];

type Result = { slug: string; name: string; brand: string; reference: string; price: number; image: string | null; artwork: string; stock: number };

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex flex-col items-center leading-none ${className}`}>
      <svg viewBox="0 0 24 12" className="mb-1 h-2.5 w-5 text-champagne" fill="currentColor" aria-hidden="true">
        <path d="M2 11 0 2l6 4 6-6 6 6 6-4-2 9H2Z" />
      </svg>
      <span className="text-[14px] font-semibold tracking-[0.3em] sm:text-[17px] sm:tracking-[0.32em]">IWATCHWORKS</span>
    </span>
  );
}

function SearchPanel({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[] | null>(null);
  const [loading, setLoading] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => input.current?.focus(), []);
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setResults(null); return; }
    setLoading(true);
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((d) => setResults(d.results ?? []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 180);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [q]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    router.push(term ? `/tienda?q=${encodeURIComponent(term)}` : "/tienda");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Buscar">
      <button className="absolute inset-0 animate-fade-in bg-ink/30 backdrop-blur-sm" onClick={onClose} aria-label="Cerrar buscador" tabIndex={-1} />
      <div className="relative max-h-[100svh] animate-fade-in overflow-y-auto bg-ivory shadow-soft">
        <div className="container-x py-5 md:py-8">
          <form onSubmit={submit} className="flex items-center gap-3 border-b border-ink/15 pb-3 focus-within:border-gold md:gap-4 md:pb-4">
            <SearchIcon className="h-5 w-5 shrink-0 text-ink-muted md:h-6 md:w-6" />
            <input
              ref={input}
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar modelo, referencia o tipo"
              className="w-full min-w-0 bg-transparent text-lg placeholder:text-ink-muted focus:outline-none md:text-2xl [&::-webkit-search-cancel-button]:hidden"
              aria-label="Buscar relojes"
              enterKeyHint="search"
              maxLength={60}
            />
            <button type="button" onClick={onClose} className="-mr-2 flex shrink-0 items-center gap-2 p-2 text-sm text-ink-soft hover:text-ink">
              <CloseIcon /> <span className="hidden sm:inline">Cerrar</span>
            </button>
          </form>

          <div className="pb-2 pt-6 md:pt-8">
            {results === null ? (
              <>
                <p className="text-[11px] font-medium uppercase tracking-luxe text-ink-muted">Sugerencias</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {SUGGESTED.map((s) => (
                    <Link key={s.href} href={s.href} onClick={onClose} className="rounded-full bg-stone px-4 py-2 text-sm text-ink-soft transition hover:bg-gold hover:text-white">{s.label}</Link>
                  ))}
                </div>
              </>
            ) : results.length === 0 ? (
              <p className="text-ink-soft">{loading ? "Buscando…" : <>No hemos encontrado relojes para “{q.trim()}”. Prueba con otra referencia o <Link href="/#contacto" onClick={onClose} className="link-gold">pregúntanos</Link>.</>}</p>
            ) : (
              <>
                <p className="text-[11px] font-medium uppercase tracking-luxe text-ink-muted">Relojes</p>
                <ul className="mt-3 grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
                  {results.map((r) => (
                    <li key={r.slug}>
                      <Link href={`/producto/${r.slug}`} onClick={onClose} className="flex items-center gap-4 rounded-2xl p-2 transition hover:bg-stone">
                        <span className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-stone">
                          <WatchImage src={r.image} art={r.artwork} alt="" sizes="64px" className="h-full w-full" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[11px] uppercase tracking-luxe text-gold">{r.brand}</span>
                          <span className="block truncate font-medium">{r.name}</span>
                          <span className="block text-sm text-ink-muted">{r.reference} · {euros(r.price)}{r.stock === 0 ? " · Agotado" : ""}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <button onClick={submit} className="link-arrow mt-5">Ver todos los resultados <ArrowIcon className="h-4 w-4" /></button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Header({ isAdmin }: { isAdmin: boolean }) {
  const { count, openCart, viewer, ready } = useCart();
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setMenu(false); setSearch(false); }, [pathname]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => {
    if (!menu && !search) return;
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") { setMenu(false); setSearch(false); } };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", key);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", key); };
  }, [menu, search]);

  const account = viewer.loggedIn ? "/cuenta" : "/iniciar-sesion";

  return (
    <>
      <header className={`sticky top-0 z-40 bg-ivory/95 text-ink backdrop-blur-xl transition-shadow duration-300 ${scrolled ? "shadow-[0_1px_0_#E2DFD6]" : ""}`}>
        <div className="container-x grid h-16 grid-cols-[1fr_auto_1fr] items-center md:h-[84px]">
          <div className="flex items-center">
            <button onClick={() => setMenu(true)} className="-ml-2 flex items-center gap-2.5 rounded-full p-2 text-[13px] font-medium transition hover:text-gold" aria-label="Abrir menú" aria-expanded={menu}>
              <MenuIcon className="h-[22px] w-[22px]" />
              <span className="hidden md:inline">Menú</span>
            </button>
          </div>

          <Link href="/" aria-label="IWatchWorks, inicio" className="text-gold">
            <Wordmark />
          </Link>

          <div className="flex items-center justify-end gap-0.5 sm:gap-1.5">
            <button onClick={() => setSearch(true)} className="flex items-center gap-2.5 rounded-full p-2 text-[13px] font-medium transition hover:text-gold" aria-label="Buscar">
              <SearchIcon className="h-[21px] w-[21px]" />
              <span className="hidden lg:inline">Buscar</span>
            </button>
            {isAdmin && (
              <Link href="/admin" className="hidden rounded-full border border-gold px-3 py-1.5 text-[11px] font-medium text-gold lg:inline-flex">Admin</Link>
            )}
            <Link href={account} className="hidden rounded-full p-2 transition hover:text-gold sm:flex" aria-label={viewer.loggedIn ? "Mi cuenta" : "Iniciar sesión"}>
              <UserIcon className="h-[21px] w-[21px]" />
            </Link>
            <button onClick={openCart} className="relative -mr-2 rounded-full p-2 transition hover:text-gold" aria-label={`Carrito, ${count} artículos`}>
              <BagIcon className="h-[22px] w-[22px]" />
              {ready && count > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-gold px-1 text-[10px] font-semibold text-white">{count}</span>
              )}
            </button>
          </div>
        </div>
      </header>

      {search && <SearchPanel onClose={() => setSearch(false)} />}

      {menu && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Menú">
          <button className="absolute inset-0 animate-fade-in bg-ink/30 backdrop-blur-sm" onClick={() => setMenu(false)} aria-label="Cerrar menú" tabIndex={-1} />
          <nav className="relative flex h-full w-full max-w-[440px] animate-slide-in-left flex-col overflow-y-auto bg-ivory shadow-2xl">
            <div className="flex h-16 shrink-0 items-center justify-between px-5 sm:px-8 md:h-[84px]">
              <button onClick={() => setMenu(false)} className="-ml-2 flex items-center gap-2.5 p-2 text-[13px] font-medium hover:text-gold">
                <CloseIcon className="h-[22px] w-[22px]" /> Cerrar
              </button>
            </div>
            <div className="flex-1 px-5 pb-10 pt-4 sm:px-8">
              <p className="text-[11px] font-medium uppercase tracking-luxe text-gold">Colección</p>
              <ul className="mt-5 space-y-4">
                {NAV.map((n, i) => (
                  <li key={n.href} className="animate-rise" style={{ animationDelay: `${i * 40}ms` }}>
                    <Link href={n.href} onClick={() => setMenu(false)} className="text-[28px] font-medium tracking-tight transition hover:text-gold">{n.label}</Link>
                  </li>
                ))}
              </ul>
              <ul className="mt-10 space-y-3 border-t border-line pt-8 text-[15px] text-ink-soft">
                {MORE.map((n) => (
                  <li key={n.href}><Link href={n.href} onClick={() => setMenu(false)} className="hover:text-gold">{n.label}</Link></li>
                ))}
              </ul>
            </div>
            <div className="border-t border-line px-5 py-6 sm:px-8">
              <Link href={account} onClick={() => setMenu(false)} className="flex items-center gap-3 text-[15px] font-medium hover:text-gold">
                <UserIcon /> {viewer.loggedIn ? `Mi cuenta${viewer.name ? ` · ${viewer.name.split(" ")[0]}` : ""}` : "Acceder o crear cuenta"}
              </Link>
              {isAdmin && <Link href="/admin" className="mt-4 block text-sm text-gold">Panel de administración</Link>}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
