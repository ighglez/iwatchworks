export const SITE = {
  name: "IWatchWorks",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  email: "info@iwatchworks.com",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP || "34600000000",
  // Datos fiscales para facturas y textos legales: complétalos antes de publicar.
  legal: {
    company: process.env.LEGAL_COMPANY || "[Razón social]",
    taxId: process.env.LEGAL_TAX_ID || "[NIF/CIF]",
    address: process.env.LEGAL_ADDRESS || "[Dirección fiscal]",
  },
  vatRate: 21,
  hours: ["Lunes a viernes: 10:00 – 19:00", "Sábados: 10:00 – 14:00"],
};

// Reglas comerciales en un único sitio para poder ajustarlas fácilmente.
export const RULES = {
  welcomeDiscountPercent: 5, // primera compra con cuenta
  pointsPerEuro: 1, // puntos ganados por cada euro pagado
  pointsBlock: 100, // se canjean en bloques de 100 puntos
  pointsBlockValueCents: 500, // 100 puntos = 5 €
  maxPointsDiscountRatio: 0.3, // como máximo el 30% del pedido con puntos
  shippingCents: 0, // envío asegurado gratuito
  reservationMinutes: 30, // tiempo que se reserva el stock mientras se paga
  maxQtyPerItem: 5,
};

export const ORDER_STATUS: Record<string, { label: string; tone: string }> = {
  PENDING: { label: "Pendiente de pago", tone: "bg-amber-50 text-amber-800 border-amber-200" },
  PAID: { label: "Pagado", tone: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  PREPARING: { label: "En preparación", tone: "bg-sky-50 text-sky-800 border-sky-200" },
  SHIPPED: { label: "Enviado", tone: "bg-indigo-50 text-indigo-800 border-indigo-200" },
  DELIVERED: { label: "Entregado", tone: "bg-gold-soft text-ink border-gold-light" },
  CANCELLED: { label: "Cancelado", tone: "bg-neutral-100 text-neutral-600 border-neutral-200" },
  REFUNDED: { label: "Reembolsado", tone: "bg-rose-50 text-rose-800 border-rose-200" },
};
