// src/Components/CatalogGate/CatalogGate.jsx
// Layout route: shows a spinner until product data exists, then renders the page.
import { Outlet } from "react-router-dom";
import { useCatalog } from "../../Context/CatalogContext";
import styles from "./CatalogGate.module.css";

export default function CatalogGate() {
  const { ready } = useCatalog();

  if (!ready) {
    return (
      <div className={styles.wrap} role="status" aria-live="polite">
        <span className={styles.spinner} aria-hidden="true" />
        <p>Loading Synara…</p>
      </div>
    );
  }
  return <Outlet />;
}
