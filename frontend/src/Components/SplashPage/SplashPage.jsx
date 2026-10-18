import styles from "./SplashPage.module.css";
import logo from "../../assets/synara-logo.png"; // transparent black logo (S mark + Synara)
import { useNavigate } from "react-router-dom";

/**
 * Synara – Splash / first page
 *
 * Optional product images (transparent PNG/WebP recommended):
 *   <SplashPage images={{ headphones, phone, laptop, charger }} onNext={...} />
 *
 * Next.js:  onNext={() => router.push("/home")}
 * Vite/CRA: onNext={() => navigate("/home")}
 */
export default function SplashPage({ images = {}, onNext }) {
  const { headphones, phone, laptop, charger } = images;
  const navigate = useNavigate();



  return (
    <main className={styles.screen}>
      {/* background shapes */}
      <span className={`${styles.blob} ${styles.blobTopRight}`} aria-hidden="true" />
      <span className={`${styles.blob} ${styles.blobBottomLeft}`} aria-hidden="true" />
      <span className={`${styles.blob} ${styles.blobBottomRight}`} aria-hidden="true" />
      <span className={styles.cube} aria-hidden="true" />

      {/* product imagery (renders only when provided) */}
      {headphones && (
        <img src={headphones} alt="" className={`${styles.product} ${styles.headphones}`} />
      )}
      {phone && <img src={phone} alt="" className={`${styles.product} ${styles.phone}`} />}
      {laptop && <img src={laptop} alt="" className={`${styles.product} ${styles.laptop}`} />}
      {charger && <img src={charger} alt="" className={`${styles.product} ${styles.charger}`} />}

      {/* brand */}
      <section className={styles.brand}>
        <img
  src={logo}
  alt="Synara"
  className={styles.logo}
  style={{ width: "min(60vw, 220px)", height: "auto" }}
/>

        <p className={styles.tagline}>
          <span>Electronics</span>
          <i aria-hidden="true" />
          <span>Repairs</span>
          <i aria-hidden="true" />
          <span>At Your Doorstep</span>
        </p>
      </section>

      <button type="button" className={styles.next} onClick={()=> navigate("/home")}>
        Next
      </button>
    </main>
  );
}