"use client";

import { useEffect } from "react";
import { useCart } from "@/components/cart/CartProvider";

export default function ClearPurchased({ ids }: { ids: string[] }) {
  const { remove, ready } = useCart();
  useEffect(() => {
    if (ready) ids.forEach(remove);
  }, [ready, ids, remove]);
  return null;
}
