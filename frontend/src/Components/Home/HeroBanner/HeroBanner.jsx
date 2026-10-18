import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import styles from "./HeroBanner.module.css";

export default function HeroBanner({ slides }) {
  const [i, setI] = useState(0);
  const s = slides[i];

  return (
    <section className={styles.wrap} aria-roledescription="carousel" aria-label="Featured offers">
      <div className={styles.banner}>
        <div className={styles.text}>
          <p className={styles.kicker}>{s.kicker}</p>
          <h1 className={styles.title}>{s.title}</h1>
          <p className={styles.sub}>{s.sub}</p>
          <Link to={s.to} className={styles.cta}>
            {s.cta} <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
        {s.image && <img src={s.image} alt="" className={styles.art} />}
      </div>

      <div className={styles.dots} role="tablist" aria-label="Choose slide">
        {slides.map((d, n) => (
          <button
            key={d.id}
            type="button"
            role="tab"
            aria-selected={n === i}
            aria-label={`Slide ${n + 1}`}
            className={n === i ? `${styles.dot} ${styles.active}` : styles.dot}
            onClick={() => setI(n)}
          />
        ))}
      </div>
    </section>
  );
}
