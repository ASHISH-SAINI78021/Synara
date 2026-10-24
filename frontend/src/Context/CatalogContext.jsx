// src/Context/CatalogContext.jsx
// Loads products, repairs and categories from the backend ONCE, shares them everywhere.
//  - shows the last saved copy instantly (so repeat visits feel fast)
//  - refreshes from the server in the background
//  - if the server is down and nothing is saved, falls back to src/data/homeData.js
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { resolveImage } from "../utils/resolveImage";
import * as local from "../data/homeData";

const KEY = "synara-catalog-v1";
const CatalogContext = createContext(null);

const fix = (p) => ({
  ...p,
  image: resolveImage(p.image),
  images: Array.isArray(p.images) ? p.images.map(resolveImage) : p.images,
});

function prepare(raw) {
  return {
    popular: (raw.popular || []).map(fix),
    accessories: (raw.accessories || []).map(fix),
    repairs: (raw.repairs || []).map((r) => ({ ...r, image: resolveImage(r.image) })),
    categoryGroups: (raw.categoryGroups || []).map((g) => ({
      ...g,
      items: (g.items || []).map((i) => ({ ...i, image: resolveImage(i.image) })),
    })),
  };
}

const valid = (d) => d && Array.isArray(d.popular) && Array.isArray(d.accessories);

function readCache() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY));
    return valid(d) ? d : null;
  } catch {
    return null;
  }
}

export function CatalogProvider({ children }) {
  const [raw, setRaw] = useState(readCache);          // saved copy, or null
  const [status, setStatus] = useState("loading");    // loading | ready | error
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    setStatus("loading");
    api("/home")
      .then((d) => {
        if (!alive) return;
        if (!valid(d)) throw new Error("Unexpected /home response");
        setRaw(d);
        setStatus("ready");
        try {
          localStorage.setItem(KEY, JSON.stringify(d));
        } catch {
          /* storage full or blocked: fine */
        }
      })
      .catch((err) => {
        if (!alive) return;
        console.warn("Catalog: backend unavailable, using saved/local data.", err);
        // no saved copy at all: use the bundled data so the shop still works
        setRaw((prev) =>
          prev ||
          {
            popular: local.popular,
            accessories: local.accessories,
            repairs: local.repairs,
            categoryGroups: local.categoryGroups,
          }
        );
        setStatus("error");
      });
    return () => {
      alive = false;
    };
  }, [tick]);

  const value = useMemo(() => {
    const data = raw ? prepare(raw) : { popular: [], accessories: [], repairs: [], categoryGroups: [] };
    const allProducts = [...data.popular, ...data.accessories];
    const byId = new Map(allProducts.map((p) => [p.id, p]));
    return {
      ...data,
      allProducts,
      getProduct: (id) => byId.get(id),
      ready: raw !== null,           // there is something to show
      loading: status === "loading",
      fresh: status === "ready",     // data just came from the server
      error: status === "error",
      refresh: () => setTick((n) => n + 1),
    };
  }, [raw, status]);

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalog must be used inside <CatalogProvider>");
  return ctx;
}
