import type { Metadata } from "next";
import { getCurrentUser, welcomeEligible } from "@/lib/auth";
import { db } from "@/lib/db";
import { toPublic } from "@/lib/product";
import CheckoutForm from "./CheckoutForm";

export const metadata: Metadata = { title: "Finalizar compra", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const buyNow = sp.comprar ? await db.product.findFirst({ where: { id: sp.comprar, active: true } }) : null;

  return (
    <div className="container-x py-10 md:py-14">
      <CheckoutForm
        cancelled={sp.cancelado === "1"}
        buyNow={buyNow ? toPublic(buyNow) : null}
        user={
          user
            ? {
                email: user.email,
                name: user.name,
                phone: user.phone ?? "",
                address: user.address ?? "",
                city: user.city ?? "",
                postalCode: user.postalCode ?? "",
                province: user.province ?? "",
                points: user.points,
                welcomeEligible: await welcomeEligible(user.id),
              }
            : null
        }
      />
    </div>
  );
}
