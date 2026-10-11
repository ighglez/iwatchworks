import "server-only";
import { euros } from "./money";
import { formatIban, getBankDetails, transferDeadline } from "./payments";

/** Props de TransferDetails para un pedido pendiente de transferencia. */
export async function transferProps(order: { number: string; total: number; createdAt: Date }) {
  const bank = await getBankDetails();
  return {
    ...bank,
    iban: formatIban(bank.iban),
    amount: euros(order.total),
    concept: order.number,
    deadline: transferDeadline(order.createdAt).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Madrid" }),
  };
}
