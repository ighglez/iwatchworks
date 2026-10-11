import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { db } from "@/lib/db";
import { toPublic } from "@/lib/product";
import { euros } from "@/lib/money";
import { RULES, SITE } from "@/lib/config";
import { getCurrentUser, welcomeEligible } from "@/lib/auth";
import Gallery from "@/components/product/Gallery";
import AddToCartButton from "@/components/product/AddToCartButton";
import StockBadge from "@/components/product/StockBadge";
import ProductCard from "@/components/product/ProductCard";
import MobileBuyBar from "@/components/product/MobileBuyBar";
import { GiftIcon, LockIcon, ReturnIcon, ShieldIcon, TruckIcon, WhatsappIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

const getProduct = cache(async (slug: string) => db.product.findFirst({ where: { slug, active: true } }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await getProduct((await params).slug);
  if (!p) return {};
  const pub = toPublic(p);
  return {
    title: `${p.brand} ${p.name} ${p.reference}`,
    description: p.description.slice(0, 155),
    openGraph: pub.images.length ? { images: pub.images.slice(0, 1) } : undefined,
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const raw = await getProduct((await params).slug);
  if (!raw) notFound();
  const p = toPublic(raw);
  const user = await getCurrentUser();
  const eligible = user ? await welcomeEligible(user.id) : true;
  const related = (await db.product.findMany({ where: { active: true, id: { not: p.id } }, orderBy: [{ featured: "desc" }], take: 6 }))
    .sort((a, b) => Number(b.category === p.category) - Number(a.category === p.category))
    .slice(0, 3)
    .map(toPublic);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${p.brand} ${p.name}`,
    sku: p.reference,
    brand: { "@type": "Brand", name: p.brand },
    ...(p.images.length ? { image: p.images } : {}),
    description: p.description,
    offers: {
      "@type": "Offer",
      priceCurrency: "EUR",
      price: (p.price / 100).toFixed(2),
      availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${SITE.url}/producto/${p.slug}`,
    },
  };

  const specs = Object.entries(p.specs).filter(([, v]) => v);

  return (
    <>
      <MobileBuyBar product={p} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <section className="container-x pb-16 pt-6 md:pb-24 md:pt-10">
        <nav className="mb-6 text-sm text-ink-muted" aria-label="Migas de pan">
          <Link href="/tienda" className="hover:text-ink">Colección</Link>
          <span className="mx-2">/</span>
          <Link href={`/tienda?categoria=${encodeURIComponent(p.category)}`} className="hover:text-ink">{p.category}</Link>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
          <Gallery images={p.images} art={p.artwork} alt={`${p.brand} ${p.name} ${p.reference}`} />

          <div className="lg:sticky lg:top-28 lg:self-start lg:py-6">
            <p className="eyebrow">{p.brand}</p>
            <h1 className="mt-4 text-4xl leading-[1.05] md:text-[56px]">{p.name}</h1>
            <p className="mt-3 text-ink-muted">Referencia {p.reference}</p>

            <div className="mt-8 flex items-baseline gap-4">
              <p className="text-3xl font-semibold tabular-nums tracking-tight">{euros(p.price)}</p>
              {p.compareAtPrice && p.compareAtPrice > p.price && <p className="text-ink-muted line-through">{euros(p.compareAtPrice)}</p>}
            </div>
            <p className="mt-1 text-sm text-ink-muted">IVA incluido. Envío asegurado gratuito.</p>
            <StockBadge stock={p.stock} threshold={p.lowStockThreshold} className="mt-5" />

            <div className="mt-8">
              <AddToCartButton product={p} variant="full" />
            </div>

            {eligible && p.stock > 0 && (
              <p className="mt-5 flex items-center gap-2.5 rounded-2xl bg-gold-soft px-4 py-3 text-sm text-ink-soft">
                <GiftIcon className="h-4 w-4 shrink-0 text-gold-dark" />
                <span>
                  {user ? "Con tu bienvenida del club: " : "Con cuenta gratuita: "}
                  <b className="font-semibold text-ink">{euros(Math.round(p.price * (1 - RULES.welcomeDiscountPercent / 100)))}</b>
                </span>
              </p>
            )}

            <ul className="mt-8 space-y-3 text-sm text-ink-soft">
              <li className="flex items-center gap-3"><TruckIcon className="h-5 w-5 text-gold-dark" /> Envío asegurado y gratuito en 24 a 72 h</li>
              <li className="flex items-center gap-3"><ShieldIcon className="h-5 w-5 text-gold-dark" /> Nuevo, original y con 3 años de garantía</li>
              <li className="flex items-center gap-3"><ReturnIcon className="h-5 w-5 text-gold-dark" /> 14 días para devolverlo sin explicaciones</li>
              <li className="flex items-center gap-3"><LockIcon className="h-5 w-5 text-gold-dark" /> Pago por transferencia bancaria, sin compartir tarjetas</li>
            </ul>
          </div>
        </div>
      </section>

      {/* DESCRIPCIÓN */}
      {p.description.trim() && (
        <section className="bg-stone">
          <div className="container-x grid gap-6 py-14 md:grid-cols-[1fr_2fr] md:gap-16 md:py-20">
            <div>
              <p className="eyebrow">{p.category}</p>
              <h2 className="mt-3 text-2xl md:text-3xl">Sobre este reloj</h2>
            </div>
            <div className="max-w-2xl space-y-4 text-[15px] leading-relaxed text-ink-soft md:text-base md:leading-[1.8]">
              {p.description.split(/\n\s*\n|\r?\n/).filter((t) => t.trim()).map((t, i) => <p key={i}>{t.trim()}</p>)}
            </div>
          </div>
        </section>
      )}

      {/* CARACTERÍSTICAS */}
      {specs.length > 0 && (
        <section className="container-x py-20 md:py-28">
          <h2 className="text-3xl md:text-5xl">Características</h2>
          <dl className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {specs.map(([k, v]) => (
              <div key={k} className="bg-white p-7">
                <dt className="text-[11px] font-medium uppercase tracking-luxe text-gold-dark">{k}</dt>
                <dd className="mt-3 text-lg font-medium leading-snug">{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* ASESORAMIENTO */}
      <section className="container-x pb-20 pt-14 md:pb-28 md:pt-20">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-stone p-8 md:flex-row md:items-center md:p-12">
          <div>
            <h2 className="text-2xl md:text-3xl">¿Tienes dudas sobre este reloj?</h2>
            <p className="mt-2 text-ink-soft">Te ayudamos con medidas, ajuste del brazalete o cualquier detalle antes de comprar.</p>
          </div>
          <a
            href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(`Hola, tengo una pregunta sobre el ${p.brand} ${p.name} (${p.reference})`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline shrink-0"
          >
            <WhatsappIcon className="h-5 w-5 text-[#1f9e55]" /> Preguntar por WhatsApp
          </a>
        </div>
      </section>

      {related.length > 0 && (
        <section className="container-x pb-24 md:pb-32">
          <h2 className="mb-12 text-3xl md:text-5xl">También te puede interesar</h2>
          <div className="grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => <ProductCard key={r.id} product={r} />)}
          </div>
        </section>
      )}
    </>
  );
}
