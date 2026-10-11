import Link from "next/link";
import { db } from "@/lib/db";
import { toPublic, type PublicProduct } from "@/lib/product";
import { SITE, RULES } from "@/lib/config";
import { euros } from "@/lib/money";
import ProductCard from "@/components/product/ProductCard";
import WatchImage from "@/components/WatchImage";
import ContactForm from "@/components/forms/ContactForm";
import { getWhatsapp } from "@/lib/contact";
import { ArrowIcon, ChatIcon, ReturnIcon, ShieldIcon, StarIcon, TruckIcon, WhatsappIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

const SERVICE = [
  { icon: TruckIcon, title: "Envío asegurado", text: "Gratuito, con seguimiento y entrega en mano." },
  { icon: ShieldIcon, title: "Garantía de 3 años", text: "Relojes nuevos, originales y con factura." },
  { icon: ReturnIcon, title: "14 días para decidir", text: "Si no es el tuyo, lo devuelves sin explicaciones." },
  { icon: ChatIcon, title: "Asesoramiento real", text: "Una persona al otro lado, por email o WhatsApp." },
];

const FAQ = [
  {
    q: "¿Los relojes son nuevos y originales?",
    a: "Sí, siempre. Cada pieza se revisa antes de salir y viaja con su caja, su documentación y tu factura de compra.",
  },
  {
    q: "¿Cuánto tarda en llegar mi pedido?",
    a: "Lo preparamos en 24 horas laborables y la entrega suele producirse en 24 a 72 horas. Recibirás el número de seguimiento por email.",
  },
  {
    q: "¿Necesito una cuenta para comprar?",
    a: `No. Puedes comprar como invitado. Si creas una cuenta, gratis, te descontamos un ${RULES.welcomeDiscountPercent}% en tu primera compra y empiezas a sumar puntos.`,
  },
  {
    q: "¿Cómo funcionan los puntos?",
    a: "Sumas 1 punto por cada euro. Cada 100 puntos equivalen a 5 € que puedes usar en tu siguiente compra con un solo clic.",
  },
  {
    q: "¿Y si cambio de opinión?",
    a: "Tienes 14 días desde que lo recibes para devolverlo sin usar. Te reembolsamos por el mismo medio de pago.",
  },
];

const STORIES: Record<string, { eyebrow: string; title: string; text: string }> = {
  GMT: {
    eyebrow: "Función GMT",
    title: "Dos husos horarios. Una sola mirada.",
    text: "La aguja adicional recorre la esfera una vez al día y señala la hora de casa, o la de tu próximo destino, sobre el bisel de 24 horas.",
  },
  Cronógrafo: {
    eyebrow: "Cronógrafo",
    title: "Cada segundo, medido.",
    text: "Tres contadores y una escala taquimétrica para cronometrar, comparar y calcular velocidades. La precisión, convertida en lenguaje visual.",
  },
};

export default async function Home() {
  const whatsapp = await getWhatsapp();
  const [all, reviews] = await Promise.all([
    db.product.findMany({ where: { active: true }, orderBy: [{ featured: "desc" }, { createdAt: "desc" }] }),
    db.review.findMany({ where: { approved: true }, orderBy: { createdAt: "desc" }, take: 3 }),
  ]);
  const products = all.map(toPublic);
  const hero = products[0];
  const featured = products.slice(0, 3);
  const stories = Object.keys(STORIES)
    .map((cat) => products.find((p) => p.category === cat))
    .filter(Boolean) as PublicProduct[];

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-ivory via-ivory to-stone">
        <div className="container-x relative flex flex-col items-center pt-14 text-center md:pt-20">
          <p className="eyebrow animate-rise">Relojería japonesa seleccionada</p>
          <h1 className="mt-6 max-w-4xl animate-rise text-[42px] leading-[1.04] [animation-delay:80ms] sm:text-6xl lg:text-[80px]">
            El tiempo, en su mejor versión.
          </h1>
          <p className="mt-6 max-w-xl animate-rise text-lg leading-relaxed text-ink-soft [animation-delay:160ms]">
            Piezas automáticas elegidas una a una, entregadas aseguradas y con el trato cercano de una relojería de confianza.
          </p>
          <div className="mt-9 flex animate-rise flex-wrap justify-center gap-3 [animation-delay:240ms]">
            <Link href="/tienda" className="btn-primary px-8">Descubrir la colección</Link>
            {hero && <Link href={`/producto/${hero.slug}`} className="btn-outline px-8">Ver el {hero.name}</Link>}
          </div>
          {hero && (
            <Link href={`/producto/${hero.slug}`} className="relative mt-10 block w-[78%] max-w-[460px] md:mt-12" aria-label={`${hero.brand} ${hero.name}`}>
              <span className="pointer-events-none absolute inset-x-[8%] bottom-[6%] top-[14%] rounded-full bg-[radial-gradient(closest-side,rgba(122,31,46,0.10),transparent)]" aria-hidden="true" />
              <WatchImage src={hero.images[0]} art={hero.artwork} alt={`${hero.brand} ${hero.name} ${hero.reference}`} eager fit="contain" sizes="(min-width: 768px) 460px, 80vw" className="relative aspect-[4/5] w-full animate-float" />
            </Link>
          )}
        </div>
      </section>

      {/* COLECCIÓN */}
      <section id="coleccion" className="container-x scroll-mt-20 py-20 md:py-32">
        <div className="mb-12 flex flex-col justify-between gap-6 md:mb-16 md:flex-row md:items-end">
          <div>
            <p className="eyebrow">La selección</p>
            <h2 className="mt-4 text-4xl md:text-6xl">Nuestros relojes</h2>
          </div>
          <Link href="/tienda" className="link-arrow">Ver toda la colección <ArrowIcon className="h-4 w-4" /></Link>
        </div>
        <div className="grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p, i) => <ProductCard key={p.id} product={p} priority={i === 0} />)}
        </div>
      </section>

      {/* HISTORIAS */}
      {stories.map((p, i) => {
        const s = STORIES[p.category];
        const alt = i % 2 === 1;
        return (
          <section key={p.id} className={alt ? "bg-stone" : "bg-ivory"}>
            <div className={`container-x grid items-center gap-10 py-20 md:grid-cols-2 md:gap-20 md:py-32 ${alt ? "md:[&>*:first-child]:order-2" : ""}`}>
              <Link href={`/producto/${p.slug}`} className={`block overflow-hidden rounded-[2rem] ${alt ? "bg-ivory" : "bg-stone"}`}>
                <WatchImage src={p.images[0]} art={p.artwork} alt={`${p.brand} ${p.name}`} fit="contain" sizes="(min-width: 768px) 50vw, 100vw" className="aspect-square w-full transition duration-700 hover:scale-[1.03]" />
              </Link>
              <div>
                <p className="eyebrow">{s.eyebrow}</p>
                <h2 className="mt-5 text-4xl leading-[1.05] md:text-6xl">{s.title}</h2>
                <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-soft">{s.text}</p>
                <div className="mt-10 flex flex-wrap items-center gap-6">
                  <Link href={`/producto/${p.slug}`} className="btn-primary">Descubrir el {p.name}</Link>
                  <span className="text-sm tabular-nums text-ink-muted">{euros(p.price)}</span>
                </div>
              </div>
            </div>
          </section>
        );
      })}

      {/* SERVICIO */}
      <section id="servicio" className="container-x scroll-mt-20 py-20 md:py-32">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">La experiencia IWatchWorks</p>
          <h2 className="mt-4 text-4xl md:text-5xl">Comprar un reloj debería ser un placer</h2>
        </div>
        <div className="mt-16 grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICE.map(({ icon: Icon, title, text }) => (
            <div key={title} className="text-center">
              <Icon className="mx-auto h-7 w-7 text-gold-dark" />
              <h3 className="mt-5 text-lg">{title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CLUB */}
      <section className="container-x pb-20 md:pb-32">
        <div className="relative overflow-hidden rounded-[2rem] bg-gold px-7 py-14 text-ivory md:px-16 md:py-20">
          <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-champagne/20 blur-3xl" aria-hidden="true" />
          <div className="relative grid items-center gap-10 md:grid-cols-[1.3fr_1fr]">
            <div>
              <p className="eyebrow-light">Club IWatchWorks</p>
              <h2 className="mt-4 text-4xl md:text-5xl">Un {RULES.welcomeDiscountPercent}% de bienvenida.<br />Y cada compra suma.</h2>
              <p className="mt-5 max-w-lg text-ivory/65">Crea tu cuenta gratis: descuento en tu primer reloj, 1 punto por cada euro y canje automático al pagar. Sin cuotas ni letra pequeña.</p>
            </div>
            <div className="flex flex-col gap-3 md:items-end">
              <Link href="/registrarse" className="btn-gold px-9">Unirme al club</Link>
              <p className="text-xs text-ivory/45">También puedes hacerlo al finalizar tu compra.</p>
            </div>
          </div>
        </div>
      </section>

      {/* OPINIONES */}
      {reviews.length > 0 && (
        <section id="opiniones" className="bg-stone py-20 md:py-28">
          <div className="container-x">
            <p className="eyebrow text-center">Compras verificadas</p>
            <h2 className="mt-4 text-center text-4xl md:text-5xl">Lo que nos cuentan</h2>
            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {reviews.map((r) => (
                <figure key={r.id} className="rounded-3xl bg-ivory p-8">
                  <div className="flex text-gold">{[1, 2, 3, 4, 5].map((i) => <StarIcon key={i} filled={i <= r.rating} />)}</div>
                  <blockquote className="mt-5 text-lg leading-relaxed">“{r.text}”</blockquote>
                  <figcaption className="mt-6 text-sm text-ink-muted">{r.name}{r.city ? ` · ${r.city}` : ""}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* PREGUNTAS + CONTACTO */}
      <section className="container-x grid gap-16 py-20 md:py-32 lg:grid-cols-2 lg:gap-24">
        <div id="preguntas" className="scroll-mt-24">
          <p className="eyebrow">Preguntas frecuentes</p>
          <h2 className="mt-4 text-4xl md:text-5xl">Antes de decidir</h2>
          <div className="mt-10 divide-y divide-line border-y border-line">
            {FAQ.map((f) => (
              <details key={f.q} className="group py-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-lg font-medium">
                  {f.q}
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line text-lg leading-none text-gold-dark transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-4 max-w-xl leading-relaxed text-ink-soft">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
        <div id="contacto" className="scroll-mt-24">
          <p className="eyebrow">Contacto</p>
          <h2 className="mt-4 text-4xl md:text-5xl">Hablemos</h2>
          <p className="mt-5 text-ink-soft">¿Buscas una referencia concreta o quieres consejo? Te responde una persona, normalmente en el mismo día.</p>
          {whatsapp.configured && (
            <a
              href={`https://wa.me/${whatsapp.number}?text=${encodeURIComponent("Hola, me gustaría información sobre un reloj")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn mt-7 bg-[#1f9e55] text-white hover:bg-[#188a49]"
            >
              <WhatsappIcon /> Escríbenos por WhatsApp
            </a>
          )}
          <p className="mt-4 text-sm text-ink-muted">{SITE.hours.join(" · ")}</p>
          <div className="card mt-10 p-6 md:p-8">
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
