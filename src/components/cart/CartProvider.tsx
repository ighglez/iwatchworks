"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  brand: string;
  reference: string;
  image: string | null;
  art?: string;
  price: number;
  stock: number;
  quantity: number;
};

export type Viewer = { loggedIn: boolean; name?: string; welcomeEligible: boolean; points: number };

type Ctx = {
  items: CartItem[];
  count: number;
  subtotal: number;
  ready: boolean;
  open: boolean;
  lastAddedId: string | null;
  viewer: Viewer;
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  openCart: () => void;
  closeCart: () => void;
  notice: string | null;
};

const CartContext = createContext<Ctx | null>(null);
const KEY = "iw_cart_v1";
const MAX = 5;

export function CartProvider({ children, viewer }: { children: React.ReactNode; viewer: Viewer }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const synced = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {}
  }, [items, ready]);

  // Sincroniza precios y stock reales con el servidor al cargar.
  useEffect(() => {
    if (!ready || synced.current || items.length === 0) return;
    synced.current = true;
    fetch("/api/cart/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })) }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((q) => {
        if (!q) return;
        setItems(
          q.lines.map((l: CartItem & { lineTotal: number }) => ({
            productId: l.productId,
            slug: l.slug,
            name: l.name,
            brand: l.brand,
            reference: l.reference,
            image: l.image,
            art: l.art,
            price: l.price,
            stock: l.stock,
            quantity: l.quantity,
          })),
        );
        if (q.issues?.length) setNotice(q.issues.join(" "));
      })
      .catch(() => {});
  }, [ready, items]);

  const add = useCallback((item: Omit<CartItem, "quantity">, qty = 1) => {
    setItems((prev) => {
      const limit = Math.min(MAX, item.stock);
      const found = prev.find((p) => p.productId === item.productId);
      if (found) {
        return prev.map((p) => (p.productId === item.productId ? { ...p, ...item, quantity: Math.min(limit, p.quantity + qty) } : p));
      }
      return [...prev, { ...item, quantity: Math.min(limit, qty) }];
    });
    setLastAddedId(item.productId);
    setOpen(true);
  }, []);

  const setQty = useCallback((productId: string, qty: number) => {
    setItems((prev) =>
      prev.map((p) => (p.productId === productId ? { ...p, quantity: Math.max(1, Math.min(Math.min(MAX, p.stock), qty)) } : p)),
    );
  }, []);

  const remove = useCallback((productId: string) => setItems((prev) => prev.filter((p) => p.productId !== productId)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<Ctx>(
    () => ({
      items,
      ready,
      open,
      lastAddedId,
      viewer,
      notice,
      count: items.reduce((s, i) => s + i.quantity, 0),
      subtotal: items.reduce((s, i) => s + i.quantity * i.price, 0),
      add,
      setQty,
      remove,
      clear,
      openCart: () => {
        setLastAddedId(null);
        setOpen(true);
      },
      closeCart: () => setOpen(false),
    }),
    [items, ready, open, lastAddedId, viewer, notice, add, setQty, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart fuera de CartProvider");
  return ctx;
}
