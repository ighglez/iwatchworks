"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "../cart/CartProvider";
import type { PublicProduct } from "@/lib/product";
import { euros } from "@/lib/money";
import { BagIcon, BoltIcon } from "../icons";

/** Barra fija en móvil para comprar sin tener que volver arriba. */
export default function MobileBuyBar({ product }: { product: PublicProduct }) {
  const { add } = useCart();
  const router = useRouter();
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > 600);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  if (product.stock <= 0) return null;
  return (
    <div className={`fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ivory/95 px-4 py-3 backdrop-blur transition-transform lg:hidden ${show ? "translate-y-0" : "translate-y-full"}`} aria-hidden={!show}>
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg leading-tight">{product.name}</p>
          <p className="text-sm tabular-nums">{euros(product.price)}</p>
        </div>
        <button
          tabIndex={show ? 0 : -1}
          aria-label="Añadir al carrito"
          onClick={() => add({ productId: product.id, slug: product.slug, name: product.name, brand: product.brand, reference: product.reference, image: product.images[0] ?? null, art: product.artwork, price: product.price, stock: product.stock })}
          className="btn-outline px-3.5 py-3"
        >
          <BagIcon className="h-5 w-5" />
        </button>
        <button tabIndex={show ? 0 : -1} onClick={() => router.push(`/checkout?comprar=${product.id}`)} className="btn-primary px-5 py-3">
          <BoltIcon className="h-4 w-4 text-champagne-light" /> Comprar ya
        </button>
      </div>
    </div>
  );
}
