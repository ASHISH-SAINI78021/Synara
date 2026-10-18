// src/context/CartContext.jsx
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { popular, accessories } from "../data/homeData";

const KEY = "synara-cart";
const MAX_QTY = 10;
export const FREE_DELIVERY_MIN = 499; // sample rule, change when you have the real one
export const DELIVERY_FEE = 30;       // sample fee

const catalog = new Map([...popular, ...accessories].map((p) => [p.id, p]));
const CartContext = createContext(null);

// the cart is saved as [{ id, qty }] so prices always come fresh from homeData
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((l) => l && catalog.has(l.id) && l.qty > 0) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [lines, setLines] = useState(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {
      /* storage full or blocked: the cart still works for this session */
    }
  }, [lines]);

  // add accepts a product object or just an id
  const add = useCallback((p) => {
    const id = typeof p === "string" ? p : p?.id;
    if (!catalog.has(id)) return;
    setLines((prev) => {
      const found = prev.find((l) => l.id === id);
      if (found) return prev.map((l) => (l.id === id ? { ...l, qty: Math.min(MAX_QTY, l.qty + 1) } : l));
      return [...prev, { id, qty: 1 }];
    });
  }, []);

  // qty 0 (or less) removes the line
  const updateQty = useCallback((id, qty) => {
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => l.id !== id)
        : prev.map((l) => (l.id === id ? { ...l, qty: Math.min(MAX_QTY, qty) } : l))
    );
  }, []);

  const remove = useCallback((id) => setLines((prev) => prev.filter((l) => l.id !== id)), []);
  const clear = useCallback(() => setLines([]), []);

  const value = useMemo(() => {
    const items = lines.map((l) => ({ ...catalog.get(l.id), qty: l.qty }));
    const count = items.reduce((n, i) => n + i.qty, 0);
    const subtotal = items.reduce((n, i) => n + i.price * i.qty, 0);
    const mrpTotal = items.reduce((n, i) => n + (i.mrp > i.price ? i.mrp : i.price) * i.qty, 0);
    const delivery = subtotal === 0 || subtotal >= FREE_DELIVERY_MIN ? 0 : DELIVERY_FEE;
    const totals = {
      subtotal,
      mrpTotal,
      savings: mrpTotal - subtotal,
      delivery,
      grand: subtotal + delivery,
      toFreeDelivery: subtotal > 0 && subtotal < FREE_DELIVERY_MIN ? FREE_DELIVERY_MIN - subtotal : 0,
    };
    const getQty = (id) => lines.find((l) => l.id === id)?.qty || 0;
    return { items, count, totals, getQty, add, updateQty, remove, clear };
  }, [lines, add, updateQty, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}