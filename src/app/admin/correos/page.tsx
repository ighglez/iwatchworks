import { requireAdmin } from "@/lib/auth";
import { emailFrom } from "@/lib/email";
import { EMAIL_KINDS, type EmailKind, sampleEmail } from "@/lib/email-samples";
import { PageTitle } from "../ui";
import TestSend from "./TestSend";

export const metadata = { title: "Correos" };
export const dynamic = "force-dynamic";

export default async function Correos({ searchParams }: { searchParams: Promise<{ ver?: string }> }) {
  const admin = await requireAdmin();
  const { ver } = await searchParams;
  const kind = (EMAIL_KINDS.find(([k]) => k === ver)?.[0] ?? "bienvenida") as EmailKind;
  const email = await sampleEmail(kind);
  const ready = Boolean(process.env.RESEND_API_KEY);

  return (
    <>
      <PageTitle title="Correos" subtitle="Los correos que reciben tus clientes, con su nombre y los datos de su pedido." />

      <div className={`mb-8 rounded-2xl border p-5 text-sm ${ready ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
        {ready ? (
          <p>Envío activado. Los correos salen desde <b>{emailFrom()}</b>. Usa «Enviarme una prueba» para comprobar que llegan bien.</p>
        ) : (
          <p><b>Los correos aún no se envían.</b> Falta conectar el servicio de envío (Resend) en Vercel. Hasta entonces puedes ver aquí cómo quedan.</p>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
        <nav className="card h-fit divide-y divide-line overflow-hidden text-sm">
          {EMAIL_KINDS.map(([k, label]) => (
            <a key={k} href={`/admin/correos?ver=${k}`} className={`block px-4 py-3 transition ${k === kind ? "bg-gold-soft font-medium text-ink" : "text-ink-soft hover:bg-ivory"}`}>{label}</a>
          ))}
        </nav>
        <section>
          <div className="card mb-4 flex flex-wrap items-center justify-between gap-4 p-4">
            <div className="min-w-0 text-sm">
              <p className="text-xs uppercase tracking-widest text-ink-muted">Asunto</p>
              <p className="truncate font-medium">{email.subject}</p>
            </div>
            <TestSend kind={kind} to={admin.email} disabled={!ready} />
          </div>
          <iframe title="Vista previa del correo" srcDoc={email.html} sandbox="" className="h-[1100px] w-full rounded-2xl border border-line bg-white" />
        </section>
      </div>
    </>
  );
}
