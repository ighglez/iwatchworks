import Link from "next/link";
import NewsletterForm from "../forms/NewsletterForm";
import { LockIcon } from "../icons";

export default function Footer() {
  return (
    <footer className="mt-24 bg-ink text-ivory/80">
      <div className="container-x grid gap-12 py-16 md:grid-cols-12">
        <div className="md:col-span-4">
          <p className="font-serif text-3xl text-ivory">IWatch<span className="text-gold">Works</span></p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed">
            Distribuidor especializado. Autenticidad garantizada, envío asegurado.
          </p>
          <p className="mt-6 flex items-center gap-2 text-xs text-ivory/60">
            <LockIcon className="h-4 w-4 text-gold" /> Pago 100% seguro · Visa · Mastercard · Apple Pay · Google Pay
          </p>
        </div>
        <div className="md:col-span-2">
          <p className="eyebrow !text-gold">Tienda</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link href="/tienda" className="hover:text-gold">Todos los relojes</Link></li>
            <li><Link href="/tienda?categoria=GMT" className="hover:text-gold">GMT</Link></li>
            <li><Link href="/tienda?categoria=Cronógrafo" className="hover:text-gold">Cronógrafos</Link></li>
            <li><Link href="/cuenta" className="hover:text-gold">Mi cuenta</Link></li>
          </ul>
        </div>
        <div className="md:col-span-2">
          <p className="eyebrow !text-gold">Ayuda</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link href="/legal/envios-devoluciones" className="hover:text-gold">Envíos y devoluciones</Link></li>
            <li><Link href="/#faq" className="hover:text-gold">Preguntas frecuentes</Link></li>
            <li><Link href="/#contacto" className="hover:text-gold">Contacto</Link></li>
            <li><Link href="/seguimiento" className="hover:text-gold">Seguir mi pedido</Link></li>
          </ul>
        </div>
        <div className="md:col-span-4">
          <p className="eyebrow !text-gold">Newsletter</p>
          <p className="mt-4 text-sm">Lanzamientos exclusivos y ediciones limitadas, sin spam.</p>
          <NewsletterForm />
          <p className="mt-2 text-xs text-ivory/50">Puedes darte de baja cuando quieras.</p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col gap-3 py-6 text-xs text-ivory/50 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} IWatchWorks. Todos los derechos reservados.</p>
          <p className="max-w-md md:text-center">Distribuidor independiente. Las marcas mostradas son propiedad de sus respectivos titulares.</p>
          <ul className="flex flex-wrap gap-4">
            <li><Link href="/legal/aviso-legal" className="hover:text-gold">Aviso legal</Link></li>
            <li><Link href="/legal/privacidad" className="hover:text-gold">Privacidad</Link></li>
            <li><Link href="/legal/cookies" className="hover:text-gold">Cookies</Link></li>
            <li><Link href="/legal/condiciones" className="hover:text-gold">Condiciones</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
