import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useCatalog } from "./CatalogContext";

const KEY = "synara-cart";
const MAX_QTY = 10;
export const FREE_DELIVERY_MIN = 499; // sample rule, change when you have the real one
export const DELIVERY_FEE = 30;       // sample fee

const CartContext = createContext(null);

// saved as [{ id, qty }]; prices always come fresh from the catalog
function load() {
  try {
    const list = JSON.parse(localStorage.getItem(KEY));
    return Array.isArray(list) ? list.filter((l) => l && l.id && l.qty > 0) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const { getProduct, allProducts, fresh } = useCatalog();
  const [lines, setLines] = useState(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {
      /* storage blocked: the cart still works for this session */
    }
  }, [lines]);

  // once the server confirmed the catalog, drop cart lines for products that no longer exist
  useEffect(() => {
    if (!fresh || !allProducts.length) return;
    setLines((prev) => {
      const next = prev.filter((l) => getProduct(l.id));
      return next.length === prev.length ? prev : next;
    });
  }, [fresh, allProducts, getProduct]);

  const add = useCallback((p) => {
    const id = typeof p === "string" ? p : p?.id;
    if (!id) return;
    setLines((prev) => {
      const found = prev.find((l) => l.id === id);
      if (found) return prev.map((l) => (l.id === id ? { ...l, qty: Math.min(MAX_QTY, l.qty + 1) } : l));
      return [...prev, { id, qty: 1 }];
    });
  }, []);

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
    const items = lines
      .map((l) => {
        const p = getProduct(l.id);
        return p ? { ...p, qty: l.qty } : null;
      })
      .filter(Boolean);
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
  }, [lines, getProduct, add, updateQty, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
