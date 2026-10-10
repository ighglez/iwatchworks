import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SITE } from "@/lib/config";

// Plantillas orientativas: revísalas con tu asesor antes de publicar.
const L = SITE.legal;
const PAGES: Record<string, { title: string; body: [string, string][] }> = {
  "aviso-legal": {
    title: "Aviso legal",
    body: [
      ["Titular", `${L.company}, con NIF ${L.taxId} y domicilio en ${L.address}. Email: ${SITE.email}.`],
      ["Objeto", "Este sitio web permite conocer y comprar los relojes que distribuimos. El acceso implica la aceptación de estas condiciones."],
      ["Propiedad intelectual", "Las marcas y nombres comerciales mostrados pertenecen a sus respectivos titulares. IWatchWorks es un distribuidor independiente y no está afiliado a ellos."],
    ],
  },
  privacidad: {
    title: "Política de privacidad",
    body: [
      ["Responsable", `${L.company} (${L.taxId}), ${L.address}. Contacto: ${SITE.email}.`],
      ["Datos y finalidad", "Tratamos los datos que nos facilitas para gestionar tus pedidos, tu cuenta y tus consultas, y, si lo autorizas, enviarte novedades."],
      ["Base legal", "Ejecución del contrato de compraventa, obligaciones legales (facturación) y tu consentimiento para comunicaciones comerciales."],
      ["Pagos", "Los pagos los procesa Stripe Payments Europe Ltd. No almacenamos los datos de tu tarjeta."],
      ["Conservación", "Conservamos los datos mientras mantengas tu cuenta y durante los plazos legales aplicables."],
      ["Tus derechos", `Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a ${SITE.email}, y reclamar ante la AEPD (aepd.es).`],
    ],
  },
  cookies: {
    title: "Política de cookies",
    body: [
      ["Qué usamos", "Solo cookies y almacenamiento técnico imprescindibles: la sesión de tu cuenta (iw_session) y tu carrito en el navegador. No usamos cookies de publicidad ni de analítica de terceros."],
      ["Pasarela de pago", "Al pagar, Stripe puede usar sus propias cookies técnicas para prevenir el fraude."],
    ],
  },
  condiciones: {
    title: "Condiciones de venta",
    body: [
      ["Precios", "Todos los precios incluyen IVA. El envío asegurado es gratuito salvo que se indique lo contrario al pagar."],
      ["Pedido y pago", "El contrato se perfecciona al confirmarse el pago. Recibirás un email de confirmación y la factura estará disponible en tu pedido."],
      ["Envío", "Enviamos a España peninsular y Baleares con agencia urgente y seguro. Plazo orientativo: 24-72 h laborables."],
      ["Desistimiento", "Dispones de 14 días naturales desde la entrega para desistir sin justificación. El reloj debe estar sin usar y con precintos y embalaje originales. Reembolsaremos el importe en un máximo de 14 días por el mismo medio de pago."],
      ["Garantía", "Los productos cuentan con la garantía legal de 3 años conforme al Real Decreto Legislativo 1/2007."],
      ["Programa de puntos", "1 punto por cada euro pagado. Cada 100 puntos equivalen a 5 € de descuento, con un máximo del 30% del pedido. El 5% de bienvenida se aplica una sola vez en la primera compra con cuenta. Los puntos no son canjeables por dinero."],
    ],
  },
  "envios-devoluciones": {
    title: "Envíos y devoluciones",
    body: [
      ["Envío asegurado gratuito", "Todos los pedidos viajan asegurados por su valor total, con número de seguimiento y entrega con firma."],
      ["Plazos", "Preparamos los pedidos en 24 h laborables. La entrega suele producirse en 24-72 h."],
      ["Devoluciones", `Tienes 14 días desde la recepción. Escríbenos a ${SITE.email} con tu número de pedido y te indicaremos cómo enviarlo.`],
    ],
  },
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const page = PAGES[(await params).slug];
  return page ? { title: page.title } : {};
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const page = PAGES[(await params).slug];
  if (!page) notFound();
  return (
    <article className="container-x max-w-3xl py-14 md:py-20">
      <h1 className="text-5xl">{page.title}</h1>
      <div className="mt-10 space-y-8">
        {page.body.map(([h, t]) => (
          <section key={h}>
            <h2 className="text-2xl">{h}</h2>
            <p className="mt-2 leading-relaxed text-ink-soft">{t}</p>
          </section>
        ))}
      </div>
    </article>
  );
}
