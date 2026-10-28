// src/Components/SimilarProduct/SimilarProducts.jsx
import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { Star, Clock, Package, ChevronRight } from "lucide-react";
import { useCatalog } from "../../Context/CatalogContext";
import styles from "./SimilarProducts.module.css";

const inr = (n) => (typeof n === "number" ? `₹${n.toLocaleString("en-IN")}` : "");

export default function SimilarProducts({
  currentId,
  limit = 6,
  title = "Similar products",
  items: itemsProp,        // optional: pass your own list of products
  seeAll = true,           // show the "See all products" bar
  onAdd,
}) {
  const { popular, accessories } = useCatalog(); // same data the home page shows
  const titleId = useId();
  const [justAdded, setJustAdded] = useState(null);

  // default list: same group first (electronics or accessories), then the other group
  const inPopular = popular.some((p) => p.id === currentId);
  const same = inPopular ? popular : accessories;
  const other = inPopular ? accessories : popular;
  const items =
    itemsProp ?? [...same, ...other].filter((p) => p.id !== currentId).slice(0, limit);

  if (!items.length) return null;

  const handleAdd = (p) => {
    onAdd?.(p); // TODO: connect to CartContext later
    setJustAdded(p.id);
    setTimeout(() => setJustAdded((cur) => (cur === p.id ? null : cur)), 1200);
  };

  return (
    <section className={styles.section} aria-labelledby={titleId}>
      <div className={styles.card}>
        <h2 id={titleId} className={styles.title}>{title}</h2>

        <ul className={styles.grid}>
          {items.map((p) => {
            const to = `/product/${p.id}`;
            const spec = p.specs?.[0]?.value;
            const added = justAdded === p.id;
            return (
              <li key={p.id} className={styles.item}>
                <div className={styles.media}>
                  <Link to={to} className={styles.imgLink} aria-label={`View ${p.name}`}>
                    {p.image ? (
                      <img src={p.image} alt="" loading="lazy" />
                    ) : (
                      <span className={styles.emoji} aria-hidden="true">{p.emoji}</span>
                    )}
                  </Link>
                  {spec ? <span className={styles.spec}>{spec}</span> : null}
                  <button
                    type="button"
                    className={`${styles.add} ${added ? styles.added : ""}`}
                    aria-label={`Add ${p.name} to cart`}
                    onClick={() => handleAdd(p)}
                  >
                    {added ? "ADDED" : "ADD"}
                  </button>
                </div>

                <p className={styles.prices}>
                  <strong>{inr(p.price)}</strong>
                  {p.mrp && p.mrp > p.price ? <del>{inr(p.mrp)}</del> : null}
                </p>
                {p.off ? <p className={styles.off}>{p.off}% OFF</p> : null}

                <h3 className={styles.name}>
                  <Link to={to} className={styles.nameLink}>{p.name}</Link>
                </h3>

                {p.rating ? (
                  <p className={styles.rating}>
                    <Star size={11} fill="#ffb800" stroke="#ffb800" aria-hidden="true" />
                    <strong>{p.rating}</strong>
                    {p.reviews ? <span>({Number(p.reviews).toLocaleString("en-IN")})</span> : null}
                  </p>
                ) : null}

                {p.delivery || p.stock ? (
                  <p className={styles.meta}>
                    {p.delivery ? (
                      <span><Clock size={11} aria-hidden="true" /> {p.delivery}</span>
                    ) : null}
                    {p.stock ? (
                      <span><Package size={11} aria-hidden="true" /> {p.stock} left</span>
                    ) : null}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>

        {seeAll ? (
          <Link to="/categories" className={styles.seeAll}>
            <span className={styles.stack} aria-hidden="true">
              {items.slice(0, 3).map((p) => (
                <span key={p.id} className={styles.stackItem}>
                  {p.image ? <img src={p.image} alt="" /> : p.emoji}
                </span>
              ))}
            </span>
            <span className={styles.seeAllText}>See all products</span>
            <ChevronRight size={18} aria-hidden="true" />
          </Link>
        ) : null}
      </div>
    </section>
  );
}