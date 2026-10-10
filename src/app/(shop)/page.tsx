import Link from "next/link";
import { existsSync } from "fs";
import path from "path";
import { db } from "@/lib/db";
import { toPublic } from "@/lib/product";
import { SITE, RULES } from "@/lib/config";
import ProductCard from "@/components/product/ProductCard";
import WatchImage from "@/components/WatchImage";
import ContactForm from "@/components/forms/ContactForm";
import { ChatIcon, GiftIcon, ReceiptIcon, ReturnIcon, ShieldIcon, StarIcon, TruckIcon, WhatsappIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

const TRUST = [
  { icon: TruckIcon, title: "Envío asegurado", text: "Gratuito, con seguro a todo riesgo y número de seguimiento en cada envío." },
  { icon: ShieldIcon, title: "Autenticidad garantizada", text: "Relojes nuevos, originales, con su caja, documentación y 3 años de garantía legal." },
  { icon: ReceiptIcon, title: "Factura en cada pedido", text: "Recibes factura con IVA desglosado, descargable desde tu pedido." },
  { icon: ChatIcon, title: "Atención personalizada", text: "Te asesoramos por email o WhatsApp antes y después de tu compra." },
];

const FAQ = [
  {
    q: "¿Sois distribuidor independiente?",
    a: "Sí. Somos un distribuidor independiente especializado en relojes automáticos japoneses. No somos distribuidor oficial de las marcas, pero todos nuestros relojes son nuevos, originales y se entregan con su caja y documentación.",
  },
  {
    q: "¿Los relojes son nuevos y auténticos?",
    a: "Siempre. Cada reloj se revisa antes del envío y se entrega precintado, con su documentación original y factura de compra. Si tuvieras cualquier duda sobre la autenticidad, te devolvemos el importe íntegro.",
  },
  {
    q: "¿Cómo funciona el envío asegurado?",
    a: "Enviamos en 24 h laborables con agencia urgente y seguro a todo riesgo por el valor del reloj. Recibirás un email con el número de seguimiento y el paquete se entrega en mano con firma.",
  },
  {
    q: "¿Puedo devolver el reloj?",
    a: "Sí, tienes 14 días naturales desde la entrega para devolverlo sin dar explicaciones, siempre que esté sin usar y con sus precintos. Te reembolsamos con el mismo método de pago.",
  },
  {
    q: "¿Tengo que registrarme para comprar?",
    a: `No, puedes comprar como invitado. Si creas una cuenta (también en el mismo pago) obtienes un ${RULES.welcomeDiscountPercent}% de descuento en tu primera compra y acumulas puntos: 1 punto por cada euro, y cada 100 puntos son 5 € de descuento.`,
  },
  {
    q: "¿Qué métodos de pago aceptáis?",
    a: "Tarjeta de crédito o débito (Visa, Mastercard), Apple Pay y Google Pay. El pago se procesa en una pasarela certificada PCI-DSS: nunca vemos ni guardamos los datos de tu tarjeta.",
  },
];

export default async function Home() {
  const [featuredRaw, reviews] = await Promise.all([
    db.product.findMany({ where: { active: true }, orderBy: [{ featured: "desc" }, { createdAt: "desc" }], take: 3 }),
    db.review.findMany({ where: { approved: true }, orderBy: { createdAt: "desc" }, take: 6 }),
  ]);
  const featured = featuredRaw.map(toPublic);
  const hero = featured[0];
  const hasCatalog = existsSync(path.join(process.cwd(), "public", "catalogo-2025.pdf"));
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="container-x grid items-center gap-10 py-14 md:grid-cols-2 md:py-24">
          <div className="animate-rise">
            <p className="eyebrow">Distribuidor independiente</p>
            <h1 className="mt-5 text-5xl font-normal leading-[1.05] md:text-7xl">
              Creemos en el valor, la historia <em className="text-gold-dark">y la precisión.</em>
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-ink-soft">
              Relojes automáticos japoneses seleccionados uno a uno. Nuevos, originales y enviados asegurados a tu puerta.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/tienda" className="btn-primary px-8">Ver tienda</Link>
              <a href={hasCatalog ? "/catalogo-2025.pdf" : "#catalogo"} className="btn-outline px-8">Descargar catálogo</a>
            </div>
            <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-ink-soft">
              <li className="flex items-center gap-2"><TruckIcon className="h-5 w-5 text-gold-dark" /> Envío asegurado</li>
              <li className="flex items-center gap-2"><ShieldIcon className="h-5 w-5 text-gold-dark" /> Autenticidad garantizada</li>
              <li className="flex items-center gap-2"><ReturnIcon className="h-5 w-5 text-gold-dark" /> 14 días de devolución</li>
            </ul>
          </div>
          {hero && (
            <Link href={`/producto/${hero.slug}`} className="group relative block">
              <div className="absolute -right-10 -top-10 h-72 w-72 rounded-full bg-gold-soft blur-3xl" aria-hidden="true" />
              <div className="relative aspect-[4/5] overflow-hidden border border-line bg-white">
                <WatchImage src={hero.images[0]} alt={`${hero.brand} ${hero.name} ${hero.reference}`} eager sizes="(min-width: 768px) 50vw, 100vw" className="h-full w-full transition duration-700 group-hover:scale-[1.03]" />
              </div>
              <div className="absolute -bottom-5 left-6 bg-ivory px-5 py-3 shadow-soft">
                <p className="eyebrow">{hero.brand} · {hero.reference}</p>
                <p className="font-serif text-xl">{hero.name}</p>
              </div>
            </Link>
          )}
        </div>
      </section>

      {/* DESTACADOS */}
      <section className="container-x py-16 md:py-24">
        <div className="mb-12 text-center">
          <p className="eyebrow">Colección</p>
          <h2 className="mt-3 text-4xl md:text-5xl">Selección destacada</h2>
          <div className="divider-gold mt-6" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
        <div className="mt-12 text-center">
          <Link href="/tienda" className="btn-outline px-10">Ver todos los relojes</Link>
        </div>
      </section>

      {/* CLUB */}
      <section className="bg-ink text-ivory">
        <div className="container-x grid items-center gap-10 py-16 md:grid-cols-[1.2fr_1fr] md:py-20">
          <div>
            <p className="eyebrow !text-gold">Club IWatchWorks</p>
            <h2 className="mt-4 text-4xl md:text-5xl">Tu primera compra, un {RULES.welcomeDiscountPercent}% más especial</h2>
            <p className="mt-5 max-w-lg text-ivory/70">
              Comprar como invitado siempre es posible. Si te unes al club, gratis, disfrutas de ventajas desde el primer día.
            </p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-3">
            {[
              [`${RULES.welcomeDiscountPercent}%`, "en tu primera compra"],
              ["1 punto", "por cada euro"],
              ["100 = 5 €", "canjea tus puntos"],
            ].map(([big, small]) => (
              <li key={big} className="border border-white/15 p-5 text-center">
                <p className="font-serif text-3xl text-gold">{big}</p>
                <p className="mt-1 text-xs uppercase tracking-widest text-ivory/60">{small}</p>
              </li>
            ))}
            <li className="sm:col-span-3 md:col-span-1 lg:col-span-3">
              <Link href="/registrarse" className="btn-gold w-full"><GiftIcon className="h-4 w-4" /> Unirme gratis</Link>
            </li>
          </ul>
        </div>
      </section>

      {/* CATÁLOGO */}
      <section id="catalogo" className="container-x scroll-mt-24 py-16 md:py-24">
        <div className="card grid items-center gap-8 p-8 md:grid-cols-[1fr_auto] md:p-12">
          <div>
            <p className="eyebrow">Catálogo completo 2025</p>
            <h2 className="mt-3 text-3xl md:text-4xl">Toda la colección, en un solo documento</h2>
            <p className="mt-3 max-w-xl text-sm text-ink-soft">Descarga directa, sin registro. Si prefieres verlo online, la tienda está siempre actualizada con precio y disponibilidad.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {hasCatalog && <a href="/catalogo-2025.pdf" download className="btn-primary">Descargar catálogo</a>}
            <Link href="/tienda" className="btn-outline">Ver online</Link>
          </div>
        </div>
      </section>

      {/* CONFIANZA */}
      <section id="confianza" className="scroll-mt-24 bg-white py-16 md:py-24">
        <div className="container-x">
          <div className="mb-12 text-center">
            <p className="eyebrow">Compra con tranquilidad</p>
            <h2 className="mt-3 text-4xl md:text-5xl">Tu confianza es nuestra prioridad</h2>
            <div className="divider-gold mt-6" />
          </div>
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST.map(({ icon: Icon, title, text }) => (
              <div key={title} className="text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold-light text-gold-dark">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-2xl">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RESEÑAS */}
      <section id="resenas" className="container-x scroll-mt-24 py-16 md:py-24">
        <div className="mb-12 text-center">
          <p className="eyebrow">Opiniones verificadas</p>
          <h2 className="mt-3 text-4xl md:text-5xl">Lo que dicen nuestros clientes</h2>
          {reviews.length > 0 && (
            <p className="mt-4 flex items-center justify-center gap-2 text-sm text-ink-soft">
              <span className="flex text-gold">{[1, 2, 3, 4, 5].map((i) => <StarIcon key={i} filled={i <= Math.round(avg)} />)}</span>
              {avg.toFixed(1)} de 5 · {reviews.length} opiniones
            </p>
          )}
        </div>
        {reviews.length ? (
          <div className="grid gap-6 md:grid-cols-3">
            {reviews.map((r) => (
              <figure key={r.id} className="card p-7">
                <div className="flex text-gold">{[1, 2, 3, 4, 5].map((i) => <StarIcon key={i} filled={i <= r.rating} />)}</div>
                <blockquote className="mt-4 font-serif text-xl leading-snug">“{r.text}”</blockquote>
                <figcaption className="mt-5 text-xs uppercase tracking-widest text-ink-muted">
                  {r.name}{r.city ? ` · ${r.city}` : ""}{r.product ? ` · ${r.product}` : ""}
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-ink-soft">Las opiniones de compras verificadas aparecerán aquí.</p>
        )}
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-24 bg-white py-16 md:py-24">
        <div className="container-x max-w-3xl">
          <div className="mb-10 text-center">
            <p className="eyebrow">Resolvemos tus dudas</p>
            <h2 className="mt-3 text-4xl md:text-5xl">Preguntas frecuentes</h2>
          </div>
          <div className="divide-y divide-line border-y border-line">
            {FAQ.map((f) => (
              <details key={f.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-serif text-xl">
                  {f.q}
                  <span className="text-2xl text-gold-dark transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACTO */}
      <section id="contacto" className="container-x scroll-mt-24 py-16 md:py-24">
        <div className="grid gap-12 md:grid-cols-[1fr_1.3fr]">
          <div>
            <p className="eyebrow">Hablemos</p>
            <h2 className="mt-3 text-4xl md:text-5xl">Contáctanos</h2>
            <p className="mt-4 text-ink-soft">¿Buscas un modelo concreto o tienes dudas antes de comprar? Te respondemos personalmente.</p>
            <a
              href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent("Hola, estoy interesado en un reloj")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn mt-8 bg-[#25D366] text-white hover:bg-[#1ebe5a]"
            >
              <WhatsappIcon /> Escríbenos por WhatsApp
            </a>
            <div className="mt-10">
              <p className="eyebrow">Horario de atención</p>
              <ul className="mt-3 space-y-1 text-sm text-ink-soft">{SITE.hours.map((h) => <li key={h}>{h}</li>)}</ul>
            </div>
          </div>
          <div className="card p-6 md:p-10">
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
