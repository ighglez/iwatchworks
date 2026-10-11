"use client";

import { useRouter } from "next/navigation";
import { useCart } from "../cart/CartProvider";
import type { PublicProduct } from "@/lib/product";
import { BagIcon, BoltIcon } from "../icons";

type Props = { product: PublicProduct; variant?: "card" | "full" };

export default function AddToCartButton({ product, variant = "card" }: Props) {
  const { add } = useCart();
  const router = useRouter();
  const soldOut = product.stock <= 0;
  const item = {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    reference: product.reference,
    image: product.images[0] ?? null,
    art: product.artwork,
    price: product.price,
    stock: product.stock,
  };

  void variant;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <button disabled={soldOut} onClick={() => router.push(`/checkout?comprar=${product.id}`)} className="btn-primary py-4 text-[15px]">
        <BoltIcon className="h-4 w-4 text-champagne-light" /> {soldOut ? "Agotado" : "Comprar ya"}
      </button>
      <button disabled={soldOut} onClick={() => add(item)} className="btn-outline py-4 text-[15px]">
        <BagIcon className="h-4 w-4" /> Añadir al carrito
      </button>
    </div>
  );
}
