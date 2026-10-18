// src/pages/Categories/CategoriesPage.jsx
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Search, ShoppingBag } from "lucide-react";
import { categoryGroups } from "../../data/homeData";
import { useCart } from "../../Context/CartContext";
import Header from "../../Components/Home/Header/Header.jsx";
import BottomNav from "../../Components/Home/BottomNav/BottomNav.jsx";
import CategoryGrid from "../../Components/CategoryGrid/CategoryGrid.jsx";
import styles from "./Categories.module.css";

export default function CategoriesPage() {
  const { count } = useCart();
  const [q, setQ] = useState("");

  // filter tiles by name; hide groups that end up empty
  const groups = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return categoryGroups;
    return categoryGroups
      .map((g) => ({ ...g, items: g.items.filter((i) => i.name.toLowerCase().includes(t)) }))
      .filter((g) => g.items.length > 0);
  }, [q]);

  return (
    <>
      <Header cartCount={count} />

      <main className={styles.page}>
        <h1 className={styles.title}>All categories</h1>

        <label className={styles.search}>
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search categories"
            aria-label="Search categories"
          />
        </label>

        <Link to="/categories/all" className={styles.allRow}>
          <span className={styles.allIcon}><ShoppingBag size={18} aria-hidden="true" /></span>
          <span className={styles.allText}>
            <strong>Browse all products</strong>
            <small>Everything in one list</small>
          </span>
          <ChevronRight size={18} aria-hidden="true" />
        </Link>

        {groups.length ? (
          <CategoryGrid groups={groups} />
        ) : (
          <p className={styles.none}>No category matches “{q}”.</p>
        )}
      </main>

      <BottomNav cartCount={count} />
    </>
  );
}