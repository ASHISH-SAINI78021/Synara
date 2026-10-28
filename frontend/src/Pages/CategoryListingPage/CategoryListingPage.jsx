// src/pages/Categories/CategoryListingPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useCatalog } from "../../Context/CatalogContext";
import { useCart } from "../../Context/CartContext";
import Header from "../../Components/Home/Header/Header.jsx";
import BottomNav from "../../Components/Home/BottomNav/BottomNav.jsx";
import ProductCard from "../../Components/Home/ProductCard/ProductCard.jsx";
import styles from "./CategoryListing.module.css";

const ALL = { id: "all", name: "All products", emoji: "🛍️", image: null };

const SORTS = [
  { id: "relevance", label: "Relevance" },
  { id: "low", label: "Price: Low to High" },
  { id: "high", label: "Price: High to Low" },
  { id: "rating", label: "Top rated" },
];

// "Smart Watches", "smart-watches", "smart watch" and "SMARTWATCH" all compare equal
const norm = (v) => String(v ?? "").toLowerCase().replace(/[^a-z0-9]/g, "").replace(/s$/, "");

/*
  Which products belong to a category?
  1) A product's `category` (set in Admin) is matched against the category id OR name,
     ignoring case, spaces, dashes and plural "s".
  2) If the product has no category, or its category isn't one of the shop's categories
     (a typo), fall back to matching the category's words against the product name.
*/
function belongs(p, cat, cats) {
  if (cat.id === "all") return true;

  const list = (Array.isArray(p.category) ? p.category : [p.category]).filter(Boolean);
  if (list.length) {
    const wanted = new Set([norm(cat.id), norm(cat.name)]);
    if (list.some((c) => wanted.has(norm(c)))) return true;

    const known = new Set(cats.flatMap((c) => [norm(c.id), norm(c.name)]));
    if (list.some((c) => known.has(norm(c)))) return false; // belongs to a different, valid category
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
  // same backend data the home page uses (not the bundled sample list)
  const { allProducts, categoryGroups } = useCatalog();
  const cats = useMemo(() => [ALL, ...categoryGroups.flatMap((g) => g.items)], [categoryGroups]);
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
    const list = allProducts.filter((p) => belongs(p, cat, cats));
    if (sort === "low") return [...list].sort((a, b) => a.price - b.price);
    if (sort === "high") return [...list].sort((a, b) => b.price - a.price);
    if (sort === "rating") return [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    return list;
  }, [cat, cats, allProducts, sort]);

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