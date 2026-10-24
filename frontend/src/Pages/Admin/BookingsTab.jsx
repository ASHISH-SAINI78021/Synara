// src/Pages/Admin/BookingsTab.jsx
import { useCallback, useEffect, useState } from "react";
import { Phone, MessageCircle, RefreshCw, MapPin } from "lucide-react";
import styles from "./Admin.module.css";

const STATUSES = ["Booked", "Completed", "Cancelled"];
const fmt = (t) =>
  t ? new Date(t).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "";

export default function BookingsTab({ call, notify, onChange }) {
  const [list, setList] = useState([]);
  const [status, setStatus] = useState("Booked");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setList(await call(`/bookings${status ? `?status=${status}` : ""}`));
    } catch (err) {
      notify(`Could not load bookings: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [call, notify, status]);

  useEffect(() => {
    load();
  }, [load]);

  const setBookingStatus = async (b, next) => {
    try {
      await call(`/bookings/${encodeURIComponent(b.id)}`, { method: "PATCH", body: { status: next } });
      notify(`${b.id} marked ${next}`);
      await load();
      onChange();
    } catch (err) {
      notify(`Could not update: ${err.message}`);
    }
  };

  return (
    <section>
      <div className={styles.toolbar}>
        <div className={styles.chips} role="group" aria-label="Filter by status">
          {["", ...STATUSES].map((s) => (
            <button key={s || "all"} type="button" aria-pressed={status === s} className={status === s ? `${styles.chip} ${styles.on}` : styles.chip} onClick={() => setStatus(s)}>
              {s || "All"}
            </button>
          ))}
        </div>
        <button type="button" className={styles.ghost} onClick={load}>
          <RefreshCw size={14} aria-hidden="true" /> Refresh
        </button>
      </div>

      {loading ? (
        <p className={styles.empty}>Loading…</p>
      ) : list.length ? (
        <ul className={styles.cards}>
          {list.map((b) => (
            <li key={b.id} className={styles.bcard}>
              <div className={styles.bHead}>
                <strong>{b.service}</strong>
                <span className={`${styles.badge} ${styles[b.status] || ""}`}>{b.status}</span>
              </div>
              <p className={styles.bLine}><strong>{b.device}</strong>{b.issues?.length ? ` · ${b.issues.join(", ")}` : ""}</p>
              {b.notes ? <p className={styles.note}>“{b.notes}”</p> : null}
              <p className={styles.bLine}>
                {b.dateLabel || b.date} · {b.slot} · {b.mode === "pickup" ? "Doorstep pickup" : "Customer visits shop"}
              </p>
              <p className={styles.bLine}><MapPin size={13} aria-hidden="true" /> {b.address}</p>
              <p className={styles.bLine}>{b.name} · +91 {b.phone}</p>
              <p className={styles.meta}>ID {b.id} · booked {fmt(b.createdAt)}</p>

              <div className={styles.bActions}>
                <a className={styles.linkBtn} href={`tel:+91${b.phone}`}><Phone size={14} aria-hidden="true" /> Call</a>
                <a className={styles.linkBtn} href={`https://wa.me/91${b.phone}`} target="_blank" rel="noreferrer"><MessageCircle size={14} aria-hidden="true" /> WhatsApp</a>
                {STATUSES.filter((s) => s !== b.status).map((s) => (
                  <button key={s} type="button" className={s === "Cancelled" ? styles.ghostDanger : styles.ghost} onClick={() => setBookingStatus(b, s)}>
                    {s === "Booked" ? "Reopen" : s === "Completed" ? "Mark completed" : "Cancel"}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>No {status ? status.toLowerCase() : ""} bookings.</p>
      )}
    </section>
  );
}
