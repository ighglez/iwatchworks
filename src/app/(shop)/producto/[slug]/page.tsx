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
import { GiftIcon, LockIcon, ReceiptIcon, ReturnIcon, ShieldIcon, TruckIcon, WhatsappIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

const getProduct = cache(async (slug: string) => db.product.findFirst({ where: { slug, active: true } }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await getProduct((await params).slug);
  if (!p) return {};
  const pub = toPublic(p);
  return {
    title: `${p.brand} ${p.name} ${p.reference}`,
    description: p.description.slice(0, 155),
    openGraph: { images: pub.images.slice(0, 1) },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const raw = await getProduct((await params).slug);
  if (!raw) notFound();
  const p = toPublic(raw);
  const user = await getCurrentUser();
  const eligible = user ? await welcomeEligible(user.id) : true;
  const related = (
    await db.product.findMany({ where: { active: true, id: { not: p.id } }, orderBy: [{ featured: "desc" }], take: 6 })
  )
    .sort((a, b) => Number(b.category === p.category) - Number(a.category === p.category))
    .slice(0, 3)
    .map(toPublic);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${p.brand} ${p.name}`,
    sku: p.reference,
    brand: { "@type": "Brand", name: p.brand },
    image: p.images,
    description: p.description,
    offers: {
      "@type": "Offer",
      priceCurrency: "EUR",
      price: (p.price / 100).toFixed(2),
      availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${SITE.url}/producto/${p.slug}`,
    },
  };

  return (
    <div className="container-x py-8 md:py-14">
      <MobileBuyBar product={p} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <nav className="mb-6 text-xs text-ink-muted" aria-label="Migas de pan">
        <Link href="/" className="hover:text-ink">Inicio</Link> / <Link href="/tienda" className="hover:text-ink">Tienda</Link> / <span className="text-ink-soft">{p.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <Gallery images={p.images} alt={`${p.brand} ${p.name} ${p.reference}`} />

        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="eyebrow">{p.brand} · {p.category}</p>
          <h1 className="mt-3 text-4xl leading-tight md:text-5xl">{p.name}</h1>
          <p className="mt-2 text-sm text-ink-muted">Referencia {p.reference}</p>

          <div className="mt-6 flex items-end gap-4">
            <p className="font-serif text-4xl tabular-nums">{euros(p.price)}</p>
            {p.compareAtPrice && p.compareAtPrice > p.price && <p className="pb-1 text-ink-muted line-through">{euros(p.compareAtPrice)}</p>}
          </div>
          <p className="mt-1 text-xs text-ink-muted">IVA incluido · Envío asegurado gratuito</p>
          <StockBadge stock={p.stock} threshold={p.lowStockThreshold} className="mt-4" />

          <div className="mt-7">
            <AddToCartButton product={p} variant="full" />
          </div>

          {eligible && p.stock > 0 && (
            <p className="mt-4 flex items-center gap-2 text-sm text-ink-soft">
              <GiftIcon className="h-4 w-4 text-gold-dark" />
              {user ? "Tu 5% de bienvenida: " : "Con cuenta gratuita: "}
              <span className="font-medium text-ink">{euros(Math.round(p.price * (1 - RULES.welcomeDiscountPercent / 100)))}</span>
              {!user && <span className="text-ink-muted">(opcional, también al pagar)</span>}
            </p>
          )}

          <ul className="mt-8 grid gap-4 border-y border-line py-6 text-sm sm:grid-cols-2">
            <li className="flex gap-3"><TruckIcon className="h-5 w-5 shrink-0 text-gold-dark" /><span><b className="font-medium">Envío asegurado gratis</b><br /><span className="text-ink-muted">Entrega en 24/72 h con seguimiento</span></span></li>
            <li className="flex gap-3"><ShieldIcon className="h-5 w-5 shrink-0 text-gold-dark" /><span><b className="font-medium">100% original</b><br /><span className="text-ink-muted">Caja, documentación y 3 años de garantía</span></span></li>
            <li className="flex gap-3"><ReturnIcon className="h-5 w-5 shrink-0 text-gold-dark" /><span><b className="font-medium">14 días de devolución</b><br /><span className="text-ink-muted">Sin preguntas</span></span></li>
            <li className="flex gap-3"><ReceiptIcon className="h-5 w-5 shrink-0 text-gold-dark" /><span><b className="font-medium">Factura incluida</b><br /><span className="text-ink-muted">Con IVA desglosado</span></span></li>
          </ul>

          <p className="mt-6 flex items-center gap-2 text-xs text-ink-muted">
            <LockIcon className="h-4 w-4" /> Pago seguro con tarjeta, Apple Pay o Google Pay. No guardamos los datos de tu tarjeta.
          </p>

          <div className="mt-8">
            <h2 className="text-2xl">Descripción</h2>
            <p className="mt-3 leading-relaxed text-ink-soft">{p.description}</p>
          </div>

          {Object.keys(p.specs).length > 0 && (
            <div className="mt-8">
              <h2 className="text-2xl">Características</h2>
              <dl className="mt-3 divide-y divide-line border-y border-line text-sm">
                {Object.entries(p.specs).map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[140px_1fr] gap-4 py-3">
                    <dt className="text-ink-muted">{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <a
            href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(`Hola, tengo una pregunta sobre el ${p.brand} ${p.name} (${p.reference})`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 text-sm text-ink-soft hover:text-ink"
          >
            <WhatsappIcon className="h-5 w-5 text-[#25D366]" /> ¿Dudas sobre este reloj? Pregúntanos por WhatsApp
          </a>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-24">
          <h2 className="mb-8 text-center text-4xl">También te puede interesar</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => <ProductCard key={r.id} product={r} />)}
          </div>
        </section>
      )}
    </div>
  );
}
