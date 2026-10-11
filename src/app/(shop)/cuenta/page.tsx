import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser, welcomeEligible } from "@/lib/auth";
import { logout } from "@/app/actions/auth";
import { euros } from "@/lib/money";
import { ORDER_STATUS, RULES } from "@/lib/config";
import { pointsValue } from "@/lib/pricing";
import { PasswordForm, ProfileForm } from "@/components/forms/AuthForms";
import { GiftIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Mi cuenta", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Cuenta({ searchParams }: { searchParams: Promise<{ bienvenida?: string }> }) {
  const user = await requireUser();
  const { bienvenida } = await searchParams;
  const [orders, log, eligible] = await Promise.all([
    db.order.findMany({ where: { userId: user.id, status: { not: "PENDING" } }, orderBy: { createdAt: "desc" }, include: { items: true } }),
    db.pointsTransaction.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 10 }),
    welcomeEligible(user.id),
  ]);
  const toNext = RULES.pointsBlock - (user.points % RULES.pointsBlock);

  return (
    <div className="container-x py-12 md:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Mi cuenta</p>
          <h1 className="mt-2 text-5xl">Hola, {user.name.split(" ")[0]}</h1>
        </div>
        <form action={logout}><button className="btn-ghost text-xs uppercase tracking-widest">Cerrar sesión</button></form>
      </div>

      {bienvenida && (
        <p className="mt-6 flex items-center gap-2 rounded-2xl border border-gold-light bg-gold-soft p-4 text-sm">
          <GiftIcon className="h-5 w-5 text-gold-dark" /> ¡Bienvenido al club! Tu 5% se aplicará automáticamente en tu primera compra.
        </p>
      )}

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        <div className="rounded-3xl bg-night p-8 text-ivory md:col-span-1">
          <p className="eyebrow-light">Tus puntos</p>
          <p className="mt-3 font-display text-6xl text-gold">{user.points}</p>
          <p className="mt-1 text-sm text-ivory/70">Equivalen a {euros(pointsValue(user.points))} de descuento</p>
          <div className="mt-5 h-1 overflow-hidden rounded-full bg-white/10"><div className="h-1 rounded-full bg-gold" style={{ width: `${((RULES.pointsBlock - toNext) / RULES.pointsBlock) * 100}%` }} /></div>
          <p className="mt-2 text-xs text-ivory/50">Te faltan {toNext} puntos para los próximos 5 €</p>
          {eligible && <p className="mt-5 border-t border-white/10 pt-4 text-sm text-gold-light">+ 5% de bienvenida pendiente de usar</p>}
        </div>
        <div className="card p-7 md:col-span-2">
          <h2 className="text-2xl">Mis pedidos</h2>
          {orders.length === 0 ? (
            <div className="mt-4 text-sm text-ink-soft">
              Aún no tienes pedidos. <Link href="/tienda" className="link-gold">Descubre la colección</Link>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {orders.map((o) => (
                <li key={o.id}>
                  <Link href={`/pedido/${o.number}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl px-3 py-4 hover:bg-stone">
                    <div>
                      <p className="font-medium">{o.number}</p>
                      <p className="text-xs text-ink-muted">{o.createdAt.toLocaleDateString("es-ES")} · {o.items.map((i) => i.name).join(", ")}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-widest ${ORDER_STATUS[o.status]?.tone}`}>{ORDER_STATUS[o.status]?.label}</span>
                      <span className="tabular-nums">{euros(o.total)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <div className="card p-7 md:col-span-2">
          <h2 className="mb-5 text-2xl">Mis datos</h2>
          <ProfileForm profile={{ name: user.name, phone: user.phone ?? "", address: user.address ?? "", postalCode: user.postalCode ?? "", city: user.city ?? "", province: user.province ?? "" }} />
          <h2 className="mb-5 mt-10 text-2xl">Contraseña</h2>
          <PasswordForm />
        </div>
        <div className="card p-7">
          <h2 className="text-2xl">Movimientos de puntos</h2>
          {log.length === 0 ? (
            <p className="mt-4 text-sm text-ink-soft">Ganarás {RULES.pointsPerEuro} punto por cada euro de tus compras.</p>
          ) : (
            <ul className="mt-4 space-y-3 text-sm">
              {log.map((l) => (
                <li key={l.id} className="flex justify-between gap-3">
                  <span className="text-ink-soft">{l.reason}</span>
                  <span className={l.points >= 0 ? "text-emerald-700" : "text-rose-700"}>{l.points > 0 ? "+" : ""}{l.points}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
