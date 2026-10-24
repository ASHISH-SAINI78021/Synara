// src/Pages/Admin/AdminUI.jsx  (small shared pieces for the admin screens)
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import styles from "./Admin.module.css";

export function Modal({ title, onClose, children }) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && closeRef.current();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div className={styles.overlay} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label={title}>
        <header className={styles.modalHead}>
          <h2>{title}</h2>
          <button type="button" className={styles.iconBtn} aria-label="Close" onClick={onClose}>
            <X size={18} />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, hint, wide, children }) {
  return (
    <label className={wide ? `${styles.field} ${styles.wide}` : styles.field}>
      <span>{label}</span>
      {children}
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}
