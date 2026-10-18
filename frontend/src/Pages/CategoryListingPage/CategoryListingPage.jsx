// src/pages/Categories/CategoryListingPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { categoryGroups, popular, accessories } from "../../data/homeData";
import { useCart } from "../../Context/CartContext";
import Header from "../../Components/Home/Header/Header.jsx";
import BottomNav from "../../Components/Home/BottomNav/BottomNav.jsx";
import ProductCard from "../../Components/Home/ProductCard/ProductCard.jsx";
import styles from "./CategoryListing.module.css";

const allProducts = [...popular, ...accessories];
const ALL = { id: "all", name: "All products", emoji: "🛍️", image: null };
const cats = [ALL, ...categoryGroups.flatMap((g) => g.items)];

const SORTS = [
  { id: "relevance", label: "Relevance" },
  { id: "low", label: "Price: Low to High" },
  { id: "high", label: "Price: High to Low" },
  { id: "rating", label: "Top rated" },
];

/*
  Which products belong to a category?
  1) Best: give each product a `category` in homeData.js, e.g. category: "chargers".
  2) Until then: match the category's words against the product name.
*/
function belongs(p, cat) {
  if (cat.id === "all") return true;
  if (p.category) {
    return Array.isArray(p.category) ? p.category.includes(cat.id) : p.category === cat.id;
  }
  const hay = String(p.name || "").toLowerCase().replace(/\s+/g, "");
  return String(cat.name)
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((w) => w.length > 3 && w !== "more")
    .map((w) => w.replace(/s$/, ""))
    .some((w) => hay.includes(w));
}

export default function CategoryListingPage() {
  const { slug } = useParams();
  const { count, add } = useCart();
  const [sort, setSort] = useState("relevance");
  const activeRef = useRef(null);

  const cat = cats.find((c) => c.id === slug);

  // new category: back to the top, default sort, keep the active rail item in view
  useEffect(() => {
    window.scrollTo(0, 0);
    setSort("relevance");
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [slug]);

  const products = useMemo(() => {
    if (!cat) return [];
    const list = allProducts.filter((p) => belongs(p, cat));
    if (sort === "low") return [...list].sort((a, b) => a.price - b.price);
    if (sort === "high") return [...list].sort((a, b) => b.price - a.price);
    if (sort === "rating") return [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    return list;
  }, [cat, sort]);

  if (!cat) {
    return (
      <>
        <Header cartCount={count} />
        <main className={styles.missing}>
          <h1>Category not found</h1>
          <Link to="/categories" className={styles.backLink}>See all categories</Link>
        </main>
        <BottomNav cartCount={count} />
      </>
    );
  }

  return (
    <>
      <Header cartCount={count} />

      <div className={styles.page}>
        {/* ---------- left rail ---------- */}
        <nav className={styles.rail} aria-label="Categories">
          <ul>
            {cats.map((c, i) => {
              const active = c.id === slug;
              return (
                <li key={`${c.id}-${i}`} ref={active ? activeRef : null}>
                  <Link
                    to={`/categories/${c.id}`}
                    className={active ? `${styles.railItem} ${styles.railActive}` : styles.railItem}
                    aria-current={active ? "page" : undefined}
                  >
                    <span className={styles.railTile}>
                      {c.image ? <img src={c.image} alt="" loading="lazy" /> : <span aria-hidden="true">{c.emoji}</span>}
                    </span>
                    <span className={styles.railLabel}>{c.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* ---------- products ---------- */}
        <main className={styles.pane}>
          <div className={styles.paneHead}>
            <h1>{cat.name}</h1>
            <span>{products.length} {products.length === 1 ? "item" : "items"}</span>
          </div>

          <div className={styles.sorts} role="group" aria-label="Sort products">
            {SORTS.map((s) => (
              <button
                key={s.id}
                type="button"
                className={sort === s.id ? `${styles.chip} ${styles.chipOn}` : styles.chip}
                aria-pressed={sort === s.id}
                onClick={() => setSort(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>

          {products.length ? (
            <ul className={styles.grid}>
              {products.map((p) => (
                <li key={p.id}>
                  <ProductCard product={p} onAdd={add} />
                </li>
              ))}
            </ul>
          ) : (
            <div className={styles.empty}>
              <p>No products in {cat.name} yet.</p>
              <Link to="/categories/all" className={styles.backLink}>Browse all products</Link>
            </div>
          )}
        </main>
      </div>

      <BottomNav cartCount={count} />
    </>
  );
}