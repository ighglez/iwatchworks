"use client";

import type { PublicProduct } from "@/lib/product";
import { useCart } from "../cart/CartProvider";
import { PlusIcon } from "../icons";

export default function QuickAdd({ product }: { product: PublicProduct }) {
  const { add } = useCart();
  return (
    <button
      onClick={() =>
        add({ productId: product.id, slug: product.slug, name: product.name, brand: product.brand, reference: product.reference, image: product.images[0] ?? null, art: product.artwork, price: product.price, stock: product.stock })
      }
      className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink/15 transition hover:border-ink hover:bg-ink hover:text-ivory"
      aria-label={`Añadir ${product.name} ${product.reference} al carrito`}
      title="Añadir al carrito"
    >
      <PlusIcon className="h-4 w-4" />
    </button>
  );
}
