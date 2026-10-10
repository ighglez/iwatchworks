import { db } from "@/lib/db";
import { markMessageRead } from "@/app/actions/admin";
import { PageTitle, fmtDate } from "../ui";

export const metadata = { title: "Mensajes" };

export default async function Mensajes() {
  const msgs = await db.contactMessage.findMany({ orderBy: [{ read: "asc" }, { createdAt: "desc" }], take: 100 });
  return (
    <>
      <PageTitle title="Mensajes" subtitle="Consultas del formulario de contacto" />
      <div className="space-y-4">
        {msgs.length === 0 && <p className="card p-8 text-center text-sm text-ink-muted">No hay mensajes.</p>}
        {msgs.map((m) => (
          <article key={m.id} className={`card p-5 ${m.read ? "opacity-60" : "border-l-4 border-l-gold"}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-medium">{m.name} <a href={`mailto:${m.email}`} className="ml-2 text-sm font-normal link-gold">{m.email}</a></p>
              <p className="text-xs text-ink-muted">{fmtDate(m.createdAt)}</p>
            </div>
            <p className="mt-3 whitespace-pre-line text-sm text-ink-soft">{m.message}</p>
            <div className="mt-4 flex gap-3">
              <a href={`mailto:${m.email}?subject=${encodeURIComponent("Tu consulta en IWatchWorks")}`} className="btn-outline px-4 py-1.5 text-xs">Responder</a>
              {!m.read && (
                <form action={markMessageRead}><input type="hidden" name="id" value={m.id} /><button className="btn-ghost px-2 py-1.5 text-xs">Marcar como leído</button></form>
              )}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
