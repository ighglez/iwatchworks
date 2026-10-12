import "server-only";
import { db } from "./db";
import { formatIban, getBankDetails, transferDeadline } from "./payments";
import {
  type Email,
  adminAlertEmail,
  cancelledEmail,
  paidEmail,
  passwordResetEmail,
  shippedEmail,
  transferEmail,
  welcomeEmail,
} from "./email-templates";
import { SITE } from "./config";

export const EMAIL_KINDS = [
  ["bienvenida", "Bienvenida al crear la cuenta"],
  ["pedido", "Pedido recibido: datos de la transferencia"],
  ["pago", "Pago recibido: pedido confirmado"],
  ["envio", "Pedido enviado"],
  ["caducado", "Reserva caducada (no llegó la transferencia)"],
  ["cancelado", "Pedido cancelado por la tienda"],
  ["contrasena", "Restablecer contraseña"],
  ["aviso", "Aviso de seguridad (solo para ti)"],
] as const;
export type EmailKind = (typeof EMAIL_KINDS)[number][0];

/** Ejemplo de cada correo con el último pedido real (o uno de muestra) para previsualizarlo. */
export async function sampleEmail(kind: EmailKind, name = "Lucía Martín"): Promise<Email> {
  const last = await db.order.findFirst({ orderBy: { createdAt: "desc" }, include: { items: true } });
  const order = last
    ? { ...last, name }
    : {
        number: "IW-261012-ABC12", name, email: "cliente@ejemplo.com", accessToken: "demo", address: "Calle Serrano 24, 3º", postalCode: "28001", city: "Madrid", province: "Madrid",
        subtotal: 42000, welcomeDiscount: 2100, codeDiscount: 0, discountCode: null, pointsDiscount: 0, pointsRedeemed: 0, shipping: 0, total: 39900, pointsEarned: 399, userId: "x",
        carrier: "SEUR", trackingNumber: "SE123456789ES", createdAt: new Date(),
        items: [{ name: "Seiko Presage Cocktail Time", reference: "SRPB43J1", image: null, price: 42000, quantity: 1 }],
      };
  switch (kind) {
    case "bienvenida":
      return welcomeEmail({ name, email: "cliente@ejemplo.com" });
    case "pedido": {
      const bank = await getBankDetails();
      const deadline = transferDeadline(new Date()).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Madrid" });
      return transferEmail(order, { ...bank, iban: formatIban(bank.iban) }, deadline);
    }
    case "pago":
      return paidEmail({ ...order, userId: order.userId ?? "x", pointsEarned: order.pointsEarned || Math.floor(order.total / 100) });
    case "envio":
      return shippedEmail({ ...order, carrier: order.carrier || "SEUR", trackingNumber: order.trackingNumber || "SE123456789ES" });
    case "caducado":
      return cancelledEmail(order, "expired");
    case "cancelado":
      return cancelledEmail(order, "store");
    case "contrasena":
      return passwordResetEmail({ name }, `${SITE.url}/recuperar/ejemplo`);
    case "aviso":
      return adminAlertEmail("Datos bancarios cambiados", "Se han cambiado los datos bancarios de la tienda desde el panel.<br><br>IBAN nuevo: <b>ES91 •••• •••• 1332</b>");
  }
}
