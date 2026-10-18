// src/Components/Home/HeroBanner/HeroBanner.jsx
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import styles from "./HeroBanner.module.css";

const AUTOPLAY_MS = 5000;
const SWIPE_PX = 40;

/*
  slides: two kinds, mixed freely
    text slide : { id, kicker, title, sub?, cta, to }
    image slide: { id, image, mobileImage?, alt, to }
*/
export default function HeroBanner({ slides }) {
  const total = slides.length;
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const start = useRef(null);
  const moved = useRef(false);

  const go = useCallback((n) => setI(((n % total) + total) % total), [total]);

  // auto-slide (off for reduced motion, while hovering/touching, or with a single slide)
  useEffect(() => {
    if (paused || total < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((n) => (n + 1) % total), AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [paused, total]);

  // swipe
  const onDown = (e) => {
    start.current = e.clientX;
    moved.current = false;
    setPaused(true);
  };
  const onUp = (e) => {
    if (start.current !== null) {
      const dx = e.clientX - start.current;
      if (Math.abs(dx) > SWIPE_PX) {
        moved.current = true;
        go(i + (dx < 0 ? 1 : -1));
      }
    }
    start.current = null;
    setPaused(false);
  };
  // a swipe that starts on a link must not open the link
  const onClickCapture = (e) => {
    if (moved.current) {
      e.preventDefault();
      e.stopPropagation();
      moved.current = false;
    }
  };

  return (
    <section className={styles.wrap} aria-roledescription="carousel" aria-label="Featured offers">
      <div
        className={styles.viewport}
        onPointerDown={onDown}
        onPointerUp={onUp}
        onPointerCancel={() => { start.current = null; setPaused(false); }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        onClickCapture={onClickCapture}
      >
        <ul className={styles.track} style={{ transform: `translate3d(-${i * 100}%, 0, 0)` }}>
          {slides.map((s, n) => {
            const active = n === i;
            const tab = active ? 0 : -1;
            const to = s.to ?? s.link ?? "/categories";
            return (
              <li
                key={s.id}
                className={styles.slide}
                role="group"
                aria-roledescription="slide"
                aria-label={`${n + 1} of ${total}`}
                aria-hidden={!active}
              >
                {s.image ? (
                  <Link to={to} className={styles.imgLink} tabIndex={tab} draggable={false}>
                    <picture>
                      <source media="(min-width: 640px)" srcSet={s.image} />
                      <img src={s.mobileImage || s.image} alt={s.alt || ""} draggable={false} />
                    </picture>
                  </Link>
                ) : (
                  <div className={styles.textSlide}>
                    <div className={styles.text}>
                      <p className={styles.kicker}>{s.kicker}</p>
                      <h1 className={styles.title}>{s.title}</h1>
                      {s.sub ?? s.subtitle ? <p className={styles.sub}>{s.sub ?? s.subtitle}</p> : null}
                      <Link to={to} className={styles.cta} tabIndex={tab}>
                        {s.cta} <ArrowRight size={18} aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {total > 1 ? (
        <div className={styles.dots} role="tablist" aria-label="Choose slide">
          {slides.map((d, n) => (
            <button
              key={d.id}
              type="button"
              role="tab"
              aria-selected={n === i}
              aria-label={`Slide ${n + 1}`}
              className={n === i ? `${styles.dot} ${styles.active}` : styles.dot}
              onClick={() => go(n)}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
