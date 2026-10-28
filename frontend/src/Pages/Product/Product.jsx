// src/pages/ProductPage.jsx
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, Heart, Share2, Clock, Star, Package,
  Tag, RefreshCcw, ShieldCheck, Minus, Plus, Check,
} from "lucide-react";
import { useCatalog } from "../../Context/CatalogContext";
import { useCart } from "../../Context/CartContext";
import Header from "../../Components/Home/Header/Header.jsx";
import SimilarProducts from "../../Components/SimilarProduct/SimilarProducts.jsx";
import styles from "./Product.module.css";

const inr = (n) => (typeof n === "number" ? `₹${n.toLocaleString("en-IN")}` : "");

function getImages(p) {
  if (Array.isArray(p.images) && p.images.length) return p.images;
  return p.image ? [p.image] : [];
}

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  // use the SAME catalog the home page uses (backend data), not the bundled sample list
  const { popular, accessories, allProducts } = useCatalog();
  const trackRef = useRef(null);
  const detailsRef = useRef(null);
  const [active, setActive] = useState(0);
  const [wished, setWished] = useState(false);

  // shared cart (replaces the old local qty state)
  const { count, getQty, add, updateQty } = useCart();
  const qty = getQty(id); // 0 = not in cart yet

  // reset when the user opens another product (e.g. from "Similar products")
  useEffect(() => {
    window.scrollTo(0, 0);
    setActive(0);
    setWished(false);
    trackRef.current?.scrollTo({ left: 0 });
  }, [id]);

  const product = allProducts.find((p) => String(p.id) === String(id));

  if (!product) {
    return (
      <>
        <Header cartCount={count} />
        <main className={styles.empty}>
          <h1>Product not found</h1>
          <Link to="/home" className={styles.homeLink}>Back to Home</Link>
        </main>
      </>
    );
  }

  const {
    name, price, mrp, off, rating, reviews, emoji, description, highlights,
    unit = "1 unit", stock, delivery, brand, offer, replacement, warranty,
  } = product;
  const specs = Array.isArray(product.specs) ? product.specs : [];
  const hasHighlights = Array.isArray(highlights) && highlights.length > 0;
  const hasDetails = Boolean(description) || hasHighlights;
  const images = getImages(product);
  const slides = images.length ? images : [null];

  // "Top products in this category": best rated in the same group
  const sameGroup = popular.some((p) => p.id === product.id) ? popular : accessories;
  const topProducts = sameGroup
    .filter((p) => p.id !== product.id)
    .sort((a, b) => (b.rating || 0) - (a.rating || 0) || (b.reviews || 0) - (a.reviews || 0))
    .slice(0, 6);

  const goTo = (i) => {
    const el = trackRef.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: el.clientWidth * i, behavior: reduce ? "auto" : "smooth" });
    setActive(i);
  };

  const onScroll = () => {
    const el = trackRef.current;
    if (!el || !el.clientWidth) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== active) setActive(i);
  };

  const scrollToDetails = () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    detailsRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  const handleShare = async () => {
    const data = { title: name, url: window.location.href };
    try {
      if (navigator.share) await navigator.share(data);
      else await navigator.clipboard.writeText(data.url);
    } catch {
      /* user cancelled sharing */
    }
  };

  // cart actions now go through the shared CartContext
  const handleAdd = () => add(product);
  const handleMinus = () => updateQty(product.id, qty - 1);
  const handlePlus = () => updateQty(product.id, qty + 1);

  return (
    <>
      <Header cartCount={count} />

      <main className={styles.page}>
        {/* ---------- floating round buttons ---------- */}
        <div className={styles.topbar}>
          <button type="button" className={styles.roundBtn} aria-label="Go back" onClick={() => navigate(-1)}>
            <ChevronLeft size={22} />
          </button>
          <div className={styles.topRight}>
            <button
              type="button"
              className={`${styles.roundBtn} ${wished ? styles.wished : ""}`}
              aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
              aria-pressed={wished}
              onClick={() => setWished((w) => !w)}
            >
              <Heart size={20} fill={wished ? "currentColor" : "none"} />
            </button>
            <button type="button" className={styles.roundBtn} aria-label="Share" onClick={handleShare}>
              <Share2 size={20} />
            </button>
          </div>
        </div>

        <div className={styles.layout}>
          {/* ---------- gallery ---------- */}
          <section className={styles.gallery} aria-label="Product images">
            <div className={styles.stage}>
              <ul className={styles.track} ref={trackRef} onScroll={onScroll}>
                {slides.map((src, i) => (
                  <li key={i} className={styles.slide}>
                    {src ? (
                      <img src={src} alt={`${name} view ${i + 1}`} loading={i === 0 ? "eager" : "lazy"} />
                    ) : (
                      <span className={styles.emoji} aria-hidden="true">{emoji}</span>
                    )}
                  </li>
                ))}
              </ul>

              {images.length > 1 ? (
                <>
                  <button
                    type="button"
                    className={`${styles.arrow} ${styles.arrowPrev}`}
                    aria-label="Previous image"
                    onClick={() => goTo((active - 1 + images.length) % images.length)}
                  >
                    <ChevronLeft size={22} />
                  </button>
                  <button
                    type="button"
                    className={`${styles.arrow} ${styles.arrowNext}`}
                    aria-label="Next image"
                    onClick={() => goTo((active + 1) % images.length)}
                  >
                    <ChevronRight size={22} />
                  </button>
                </>
              ) : null}
            </div>

            {images.length > 1 ? (
              <>
                <div className={styles.dots}>
                  {images.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`${styles.dot} ${i === active ? styles.dotActive : ""}`}
                      aria-label={`Show image ${i + 1}`}
                      aria-current={i === active}
                      onClick={() => goTo(i)}
                    />
                  ))}
                </div>
                <ul className={styles.thumbs}>
                  {images.map((src, i) => (
                    <li key={i}>
                      <button
                        type="button"
                        className={`${styles.thumb} ${i === active ? styles.thumbActive : ""}`}
                        aria-label={`Show image ${i + 1}`}
                        onClick={() => goTo(i)}
                      >
                        <img src={src} alt="" />
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </section>

          {/* ---------- details column ---------- */}
          <div className={styles.details}>
            {specs.length || hasDetails ? (
              <div className={styles.specs}>
                {specs.map((s) => (
                  <div key={s.label} className={styles.spec}>
                    <span className={styles.specLabel}>{s.label}</span>
                    <span className={styles.specValue}>{s.value}</span>
                  </div>
                ))}
                {hasDetails ? (
                  <button type="button" className={styles.detailsBtn} onClick={scrollToDetails}>
                    View<br />details
                  </button>
                ) : null}
              </div>
            ) : null}

            <section className={styles.card}>
              <div className={styles.main}>
                <div className={styles.meta}>
                  {delivery ? (
                    <span className={styles.metaItem}>
                      <Clock size={14} aria-hidden="true" /> {delivery}
                    </span>
                  ) : null}
                  {delivery && rating ? <span className={styles.sep} aria-hidden="true" /> : null}
                  {rating ? (
                    <span className={styles.metaItem} aria-label={`${rating} out of 5`}>
                      <span className={styles.stars}>
                        {[0, 1, 2, 3, 4].map((i) => (
                          <Star
                            key={i}
                            size={13}
                            fill={i < Math.round(rating) ? "#ffb800" : "none"}
                            stroke="#ffb800"
                            aria-hidden="true"
                          />
                        ))}
                      </span>
                      {reviews ? <span>{Number(reviews).toLocaleString("en-IN")}</span> : null}
                    </span>
                  ) : null}
                </div>

                <h1 className={styles.name}>{name}</h1>

                <div className={styles.unitRow}>
                  <strong>{unit}</strong>
                  {stock ? (
                    <>
                      <span className={styles.sep} aria-hidden="true" />
                      <span className={styles.stock}>
                        <Package size={14} aria-hidden="true" /> {stock} left
                      </span>
                    </>
                  ) : null}
                </div>

                <p className={styles.prices}>
                  <strong className={styles.price}>{inr(price)}</strong>
                  {mrp && mrp > price ? <del>MRP {inr(mrp)}</del> : null}
                  {off ? <span className={styles.off}>{off}% OFF</span> : null}
                </p>
              </div>

              {offer ? (
                <div className={styles.row}>
                  <span className={styles.rowIcon}><Tag size={20} aria-hidden="true" /></span>
                  <div className={styles.rowText}>
                    <strong>{offer.text}</strong>
                    {offer.code ? <span>Apply Code: {offer.code}</span> : null}
                  </div>
                  {offer.more ? <span className={styles.more}>+{offer.more} offers</span> : null}
                </div>
              ) : null}

              {brand ? (
                <Link to="/categories" className={`${styles.row} ${styles.rowLink}`}>
                  <span className={styles.rowIcon}>{brand.charAt(0)}</span>
                  <div className={styles.rowText}>
                    <strong>{brand}</strong>
                    <span>Explore all products</span>
                  </div>
                  <ChevronRight size={18} aria-hidden="true" />
                </Link>
              ) : null}
            </section>

            {replacement || warranty ? (
              <div className={styles.perks}>
                {replacement ? (
                  <div className={styles.perk}>
                    <span className={styles.rowIcon}><RefreshCcw size={18} aria-hidden="true" /></span>
                    <span>{replacement}</span>
                  </div>
                ) : null}
                {warranty ? (
                  <div className={styles.perk}>
                    <span className={styles.rowIcon}><ShieldCheck size={18} aria-hidden="true" /></span>
                    <span>{warranty}</span>
                  </div>
                ) : null}
              </div>
            ) : null}

            {hasDetails ? (
              <section ref={detailsRef} className={styles.about}>
                <h2>Product details</h2>
                {description ? <p className={styles.desc}>{description}</p> : null}
                {hasHighlights ? (
                  <ul className={styles.highlights}>
                    {highlights.map((h) => (
                      <li key={h}>
                        <Check size={16} aria-hidden="true" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ) : null}
          </div>
        </div>

        {/* ---------- similar products (ADD buttons now use the shared cart) ---------- */}
        <SimilarProducts currentId={product.id} onAdd={add} />
        <SimilarProducts
          title="Top products in this category"
          items={topProducts}
          seeAll={false}
          onAdd={add}
        />

        {/* ---------- fixed bottom bar ---------- */}
        <div className={styles.bar}>
          <div className={styles.barInner}>
            <div className={styles.barPrice}>
              <span className={styles.barUnit}>{unit}</span>
              <p>
                <strong>{inr(price)}</strong>
                {mrp && mrp > price ? <del>MRP {inr(mrp)}</del> : null}
              </p>
              <span className={styles.barTax}>Inclusive of all taxes</span>
            </div>

            {qty === 0 ? (
              <button type="button" className={styles.addBtn} onClick={handleAdd}>
                Add to cart
              </button>
            ) : (
              <div className={styles.stepper}>
                <button type="button" aria-label="Decrease quantity" onClick={handleMinus}>
                  <Minus size={18} />
                </button>
                <span aria-live="polite">{qty}</span>
                <button type="button" aria-label="Increase quantity" onClick={handlePlus}>
                  <Plus size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}