import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { logout } from "@/app/actions/auth";
import AdminNav from "./AdminNav";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin IWatchWorks" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const [toShip, unread, pendingReviews] = await Promise.all([
    db.order.count({ where: { status: { in: ["PAID", "PREPARING"] } } }),
    db.contactMessage.count({ where: { read: false } }),
    db.review.count({ where: { approved: false } }),
  ]);
  return (
    <div className="min-h-screen bg-ivory lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="border-b border-line bg-ink text-ivory lg:sticky lg:top-0 lg:h-screen lg:border-b-0">
        <div className="flex items-center justify-between px-6 py-5 lg:block">
          <Link href="/admin" className="font-serif text-2xl">IWatch<span className="text-gold">Works</span></Link>
          <p className="text-[10px] uppercase tracking-[0.3em] text-ivory/50 lg:mt-1">Administración</p>
        </div>
        <AdminNav badges={{ "/admin/pedidos": toShip, "/admin/mensajes": unread, "/admin/resenas": pendingReviews }} />
        <div className="hidden px-6 py-6 text-xs text-ivory/50 lg:absolute lg:bottom-0 lg:block">
          <p className="truncate">{admin.email}</p>
          <div className="mt-3 flex gap-4">
            <Link href="/" className="hover:text-gold">Ver tienda</Link>
            <form action={logout}><button className="hover:text-gold">Salir</button></form>
          </div>
        </div>
      </aside>
      <main className="min-w-0 px-4 py-8 sm:px-8 lg:px-10">{children}</main>
    </div>
  );
}
