import SectionHeader from "../SectionHeader/SectionHeader";
import ProductCard from "../ProductCard/ProductCard";
import styles from "./ProductSection.module.css";

export default function ProductSection({ icon, title, to, products, onAdd }) {
  return (
    <section className={styles.section}>
      <SectionHeader icon={icon} title={title} to={to} />
      <ul className={styles.rail}>
        {products.map((p) => (
          <li key={p.id}><ProductCard product={p} onAdd={onAdd} /></li>
        ))}
      </ul>
    </section>
  );
}
