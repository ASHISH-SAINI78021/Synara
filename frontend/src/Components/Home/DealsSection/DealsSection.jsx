import { Link } from "react-router-dom";
import { Tag } from "lucide-react";
import SectionHeader from "../SectionHeader/SectionHeader";
import styles from "./DealsSection.module.css";

export default function DealsSection({ deals }) {
  return (
    <section className={styles.section}>
      <SectionHeader icon={<Tag size={26} />} title="Featured Deals" to="/categories" />
      <ul className={styles.grid}>
        {deals.map((d) => (
          <li key={d.id} className={`${styles.card} ${styles[d.variant]}`}>
            <div className={styles.copy}>
              {d.lead && <p className={styles.lead}>{d.lead}</p>}
              <h3 className={d.lead ? `${styles.title} ${styles.big}` : styles.title}>{d.title}</h3>
              {d.sub && <p className={styles.sub}>{d.sub}</p>}
              <Link to="/categories" className={styles.cta}>{d.cta}</Link>
            </div>
            {d.image && <img src={d.image} alt="" className={styles.art} loading="lazy" />}
          </li>
        ))}
      </ul>
    </section>
  );
}
