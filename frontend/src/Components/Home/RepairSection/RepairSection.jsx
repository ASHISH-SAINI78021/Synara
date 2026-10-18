// src/Components/Home/RepairSection/RepairSection.jsx
import { Link } from "react-router-dom";
import { Wrench, ArrowRight } from "lucide-react";
import SectionHeader from "../SectionHeader/SectionHeader";
import styles from "./RepairSection.module.css";

export default function RepairSection({ services }) {
  return (
    <section className={styles.section}>
      <SectionHeader icon={<Wrench size={26} />} title="Repair Services" linkText="View all" to="/repairs" />
      <ul className={styles.rail}>
        {services.map((s) => (
          <li key={s.id}>
            <Link to="/repairs" className={styles.card}>
              <div className={styles.media}>
                {s.image ? <img src={s.image} alt="" loading="lazy" /> : <span aria-hidden="true">{s.emoji}</span>}
              </div>
              <h3 className={styles.name}>{s.name}</h3>
              <p className={styles.tags}>{Array.isArray(s.tags) ? s.tags.join(" · ") : s.tags}</p>
              <div className={styles.foot}>
                <span>Starting <strong>₹{s.price.toLocaleString("en-IN")}</strong></span>
                <span className={styles.go}><ArrowRight size={14} aria-hidden="true" /></span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}