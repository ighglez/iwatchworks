import Link from "next/link";
import NewsletterForm from "../forms/NewsletterForm";
import { Wordmark } from "./Header";
import { LockIcon } from "../icons";

const COLS = [
  {
    title: "Colección",
    links: [
      ["/tienda", "Todos los relojes"],
      ["/tienda?categoria=GMT", "GMT"],
      ["/tienda?categoria=Cronógrafo", "Cronógrafos"],
      ["/tienda?disponibles=1", "Disponibles hoy"],
    ],
  },
  {
    title: "Servicio",
    links: [
      ["/legal/envios-devoluciones", "Envíos y devoluciones"],
      ["/seguimiento", "Seguir mi pedido"],
      ["/#preguntas", "Preguntas frecuentes"],
      ["/#contacto", "Contacto"],
    ],
  },
  {
    title: "Club",
    links: [
      ["/registrarse", "Crear cuenta"],
      ["/cuenta", "Mi cuenta"],
      ["/legal/condiciones#puntos", "Cómo funcionan los puntos"],
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-line bg-stone text-ink-soft">
      <div className="container-x py-16 md:py-24">
        <div className="grid gap-14 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <Wordmark className="items-start text-gold [&>svg]:ml-0" />
            <p className="mt-8 max-w-sm text-[15px] leading-relaxed">Novedades, llegadas y ediciones limitadas. Un email cuando merezca la pena, nunca más.</p>
            <NewsletterForm />
          </div>
          <div className="grid gap-10 sm:grid-cols-3">
            {COLS.map((c) => (
              <div key={c.title}>
                <p className="text-[11px] font-medium uppercase tracking-luxe text-gold">{c.title}</p>
                <ul className="mt-5 space-y-3 text-[15px]">
                  {c.links.map(([href, label]) => (
                    <li key={href}>
                      <Link href={href} className="transition hover:text-gold">{label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-16 flex items-center gap-2 text-xs text-ink-muted">
          <LockIcon className="h-4 w-4 text-gold" /> Pago por transferencia bancaria. Tu reloj queda reservado mientras haces el ingreso.
        </p>
      </div>
      <div className="border-t border-line">
        <div className="container-x flex flex-col gap-4 py-7 text-xs text-ink-muted md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} IWatchWorks · Distribuidor independiente. Las marcas citadas pertenecen a sus titulares.</p>
          <ul className="flex flex-wrap gap-5">
            <li><Link href="/legal/aviso-legal" className="hover:text-gold">Aviso legal</Link></li>
            <li><Link href="/legal/privacidad" className="hover:text-gold">Privacidad</Link></li>
            <li><Link href="/legal/cookies" className="hover:text-gold">Cookies</Link></li>
            <li><Link href="/legal/condiciones" className="hover:text-gold">Condiciones de venta</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
