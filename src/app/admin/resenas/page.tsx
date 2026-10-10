import { db } from "@/lib/db";
import { moderateReview } from "@/app/actions/admin";
import { StarIcon } from "@/components/icons";
import { PageTitle, fmtDate } from "../ui";

export const metadata = { title: "Reseñas" };

export default async function Resenas() {
  const reviews = await db.review.findMany({ orderBy: [{ approved: "asc" }, { createdAt: "desc" }] });
  return (
    <>
      <PageTitle title="Reseñas" subtitle="Opiniones de compras verificadas. Solo se publican las que apruebes." />
      <div className="space-y-4">
        {reviews.length === 0 && <p className="card p-8 text-center text-sm text-ink-muted">Cuando un cliente reciba su pedido podrá dejar su opinión desde la página del pedido.</p>}
        {reviews.map((r) => (
          <article key={r.id} className={`card p-5 ${r.approved ? "" : "border-l-4 border-l-amber-400"}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="flex text-gold">{[1, 2, 3, 4, 5].map((i) => <StarIcon key={i} filled={i <= r.rating} />)}</span>
                <span className="text-sm font-medium">{r.name}{r.city ? ` · ${r.city}` : ""}</span>
                <span className="text-xs text-ink-muted">{r.product}</span>
              </div>
              <span className="text-xs text-ink-muted">{fmtDate(r.createdAt)} · {r.approved ? "Publicada" : "Pendiente"}</span>
            </div>
            <p className="mt-3 text-sm text-ink-soft">{r.text}</p>
            <form action={moderateReview} className="mt-4 flex gap-2">
              <input type="hidden" name="id" value={r.id} />
              {r.approved
                ? <button name="op" value="hide" className="btn-outline px-3 py-1.5 text-xs">Ocultar</button>
                : <button name="op" value="approve" className="btn-gold px-3 py-1.5 text-xs">Publicar</button>}
              <button name="op" value="delete" className="btn-ghost px-3 py-1.5 text-xs text-rose-700">Eliminar</button>
            </form>
          </article>
        ))}
      </div>
    </>
  );
}
