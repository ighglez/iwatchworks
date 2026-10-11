import { requireAdmin } from "@/lib/auth";
import { getBankDetails, paymentMethod } from "@/lib/payments";
import { RULES } from "@/lib/config";
import { PageTitle } from "../ui";
import BankForm from "./BankForm";

export const metadata = { title: "Ajustes" };
export const dynamic = "force-dynamic";

export default async function Ajustes() {
  await requireAdmin();
  const bank = await getBankDetails();
  return (
    <>
      <PageTitle title="Ajustes" subtitle="Datos que ven tus clientes al pagar" />
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="card p-6">
          <h2 className="text-2xl">Cuenta para transferencias</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Aparecen al confirmar el pedido, en el email al cliente y en la página de su pedido. El concepto será siempre el número de pedido.
          </p>
          <BankForm initial={bank.configured ? { holder: bank.holder, iban: bank.iban, bic: bank.bic, bank: bank.bank } : { holder: "", iban: "", bic: "", bank: "" }} />
        </div>
        <div className="card space-y-3 p-6 text-sm text-ink-soft">
          <h2 className="text-xl text-ink">Cómo funciona</h2>
          <p>Forma de pago activa: <b className="text-ink">{paymentMethod() === "transfer" ? "transferencia bancaria" : "pasarela de pago"}</b>.</p>
          <p>Al hacer el pedido, el reloj queda reservado {RULES.transferDays} días. Si la transferencia no llega en ese plazo, el pedido se cancela solo y el reloj vuelve a estar disponible.</p>
          <p>Cuando veas el ingreso en tu banco, abre el pedido y pulsa <b className="text-ink">Transferencia recibida</b>: el cliente recibe la confirmación y sus puntos.</p>
        </div>
      </div>
    </>
  );
}
