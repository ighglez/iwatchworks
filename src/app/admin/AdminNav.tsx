"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  ["/admin", "Resumen"],
  ["/admin/pedidos", "Pedidos"],
  ["/admin/productos", "Productos"],
  ["/admin/inventario", "Inventario"],
  ["/admin/descuentos", "Descuentos"],
  ["/admin/clientes", "Clientes"],
  ["/admin/mensajes", "Mensajes"],
  ["/admin/resenas", "Reseñas"],
  ["/admin/ajustes", "Ajustes"],
] as const;

export default function AdminNav({ badges }: { badges: Record<string, number> }) {
  const path = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:px-3" aria-label="Administración">
      {ITEMS.map(([href, label]) => {
        const active = href === "/admin" ? path === href : path.startsWith(href);
        return (
          <Link key={href} href={href} className={`flex shrink-0 items-center justify-between gap-3 px-3 py-2.5 text-sm transition ${active ? "bg-white/10 text-champagne-light" : "text-ivory/70 hover:bg-white/5 hover:text-ivory"}`}>
            {label}
            {badges[href] > 0 && <span className="rounded-full bg-champagne px-2 text-[11px] font-semibold text-ink">{badges[href]}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
