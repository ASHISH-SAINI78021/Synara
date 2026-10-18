// src/Components/Home/ProductCard/ProductCard.jsx
import { Link } from "react-router-dom";
import { Star, ShoppingCart } from "lucide-react";
import styles from "./ProductCard.module.css";

// safe formatter: shows nothing instead of crashing when a value is missing
const inr = (n) => (typeof n === "number" ? `₹${n.toLocaleString("en-IN")}` : "");

export default function ProductCard({ product, onAdd }) {
  const { id, name, rating, reviews, price, mrp, off, emoji, image } = product;
  const to = `/product/${id}`;
  return (
    <article className={styles.card}>
      {off ? <span className={styles.off}>{off}% OFF</span> : null}

      <div className={styles.media}>
        <Link to={to} className={styles.imgLink} aria-label={`View ${name}`}>
          {image ? (
            <img src={image} alt="" loading="lazy" />
          ) : (
            <span className={styles.emoji} aria-hidden="true">{emoji}</span>
          )}
        </Link>
        <button
          type="button"
          className={styles.add}
          aria-label={`Add ${name} to cart`}
          onClick={() => onAdd?.(product)}
        >
          <ShoppingCart size={14} />
        </button>
      </div>

      <p className={styles.prices}>
        <strong>{inr(price)}</strong>
        {mrp ? <del>{inr(mrp)}</del> : null}
      </p>

      <h3 className={styles.name}>
        <Link to={to} className={styles.nameLink}>{name}</Link>
      </h3>

      {rating ? (
        <p className={styles.rating}>
          <Star size={12} fill="#ffb800" stroke="#ffb800" aria-hidden="true" />
          <strong>{rating}</strong> <span>({reviews})</span>
        </p>
      ) : null}
    </article>
  );
}