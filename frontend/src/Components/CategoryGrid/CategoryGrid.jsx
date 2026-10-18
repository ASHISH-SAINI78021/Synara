import { Link } from "react-router-dom";
import styles from "./CategoryGrid.module.css";

export default function CategoryGrid({ groups }) {
  return (
    <div>
      {groups.map((g) => (
        <section key={g.id} className={styles.group}>
          <h2 className={styles.heading}>{g.title}</h2>
          <ul className={styles.grid}>
            {g.items.map((c) => (
              <li key={c.id}>
                <Link to={`/categories/${c.id}`} className={styles.item}>
                  <span className={styles.tile}>
                    {c.image ? (
                      <img src={c.image} alt="" loading="lazy" />
                    ) : (
                      <span className={styles.emoji} aria-hidden="true">{c.emoji}</span>
                    )}
                  </span>
                  <span className={styles.label}>{c.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}