import { RULES } from "@/lib/config";
import { CheckIcon } from "../icons";

export default function AuthShell({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) {
  return (
    <div className="container-x grid max-w-5xl gap-10 py-14 md:grid-cols-2 md:py-20">
      <div className="card p-8 md:p-10">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mb-8 mt-3 text-4xl">{title}</h1>
        {children}
      </div>
      <div className="flex flex-col justify-center rounded-3xl bg-night p-8 text-ivory md:p-12">
        <p className="eyebrow-light">Club IWatchWorks</p>
        <p className="mt-4 font-display text-3xl leading-snug">Ventajas para quienes vuelven</p>
        <ul className="mt-6 space-y-3 text-sm text-ivory/80">
          {[
            `${RULES.welcomeDiscountPercent}% de descuento en tu primera compra`,
            "1 punto por cada euro: 100 puntos = 5 €",
            "Pago más rápido con tus datos guardados",
            "Historial de pedidos, facturas y seguimiento",
          ].map((t) => (
            <li key={t} className="flex gap-3"><CheckIcon className="h-5 w-5 shrink-0 text-champagne" /> {t}</li>
          ))}
        </ul>
        <p className="mt-8 text-xs text-ivory/50">La cuenta es opcional: también puedes comprar como invitado.</p>
      </div>
    </div>
  );
}
