// src/pages/Repairs/RepairsPage.jsx
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ClipboardList, Truck, CheckCircle2, Clock, ShieldCheck, BadgeCheck, CalendarDays } from "lucide-react";
import { repairs } from "../../data/homeData";
import { useCart } from "../../Context/CartContext";
import useStored from "../../hooks/useStored";
import Header from "../../Components/Home/Header/Header.jsx";
import BottomNav from "../../Components/Home/BottomNav/BottomNav.jsx";
import RepairBooking from "./RepairBooking.jsx";
import styles from "./Repairs.module.css";

const inr = (n) => (typeof n === "number" ? `₹${n.toLocaleString("en-IN")}` : "");
const tagList = (t) => (Array.isArray(t) ? t : String(t || "").split(/[•·]/).map((s) => s.trim()).filter(Boolean));

const STEPS = [
  { Icon: ClipboardList, title: "Book online", text: "Pick a service, day and time" },
  { Icon: Truck, title: "We pick it up", text: "From your door, or visit our shop" },
  { Icon: CheckCircle2, title: "Fixed & returned", text: "Tested before it reaches you" },
];

// sample promises: replace with your real policy
const TRUST = [
  { Icon: Clock, text: "Same-day repairs" },
  { Icon: ShieldCheck, text: "30-day warranty" },
  { Icon: BadgeCheck, text: "Genuine parts" },
];

export default function RepairsPage() {
  const { count } = useCart();
  const [params, setParams] = useSearchParams();
  const [bookings, setBookings] = useStored("synara-repair-bookings", []);
  const [active, setActive] = useState(null); // the service being booked

  // /repairs?service=<id> opens that service straight away
  useEffect(() => {
    const id = params.get("service");
    if (!id) return;
    const s = repairs.find((r) => String(r.id) === id);
    if (s) setActive(s);
    setParams({}, { replace: true });
  }, [params, setParams]);

  const saveBooking = (b) => setBookings((list) => [b, ...list]);
  const cancelBooking = (id) =>
    setBookings((list) => list.map((b) => (b.id === id ? { ...b, status: "Cancelled" } : b)));

  return (
    <>
      <Header cartCount={count} />

      <main className={styles.page}>
        {/* ---------- intro ---------- */}
        <section className={styles.intro}>
          <p className={styles.kicker}>Fast · Reliable · Professional</p>
          <h1>Device repair services you can trust</h1>
          <p className={styles.lead}>Phones, laptops, tablets, watches and earbuds, fixed at your doorstep.</p>
          <ul className={styles.trust}>
            {TRUST.map(({ Icon, text }) => (
              <li key={text}><Icon size={14} aria-hidden="true" /> {text}</li>
            ))}
          </ul>
        </section>

        {/* ---------- how it works ---------- */}
        <section className={styles.steps} aria-label="How it works">
          {STEPS.map(({ Icon, title, text }, i) => (
            <div key={title} className={styles.step}>
              <span className={styles.stepIcon}><Icon size={18} aria-hidden="true" /></span>
              <strong>{i + 1}. {title}</strong>
              <span>{text}</span>
            </div>
          ))}
        </section>

        {/* ---------- services ---------- */}
        <section className={styles.block}>
          <h2 className={styles.heading}>Choose a service</h2>
          <ul className={styles.grid}>
            {repairs.map((s) => (
              <li key={s.id}>
                <article className={styles.card}>
                  <div className={styles.media}>
                    {s.image ? <img src={s.image} alt="" loading="lazy" /> : <span aria-hidden="true">{s.emoji}</span>}
                  </div>
                  <h3>{s.name}</h3>
                  <p className={styles.tags}>{tagList(s.tags).join(" · ")}</p>
                  <div className={styles.foot}>
                    <span>Starting <strong>{inr(s.price)}</strong></span>
                    <button type="button" className={styles.book} onClick={() => setActive(s)}>
                      Book
                    </button>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </section>

        {/* ---------- my bookings ---------- */}
        <section className={styles.block}>
          <h2 className={styles.heading}><CalendarDays size={18} aria-hidden="true" /> Your bookings</h2>
          {bookings.length ? (
            <ul className={styles.bookings}>
              {bookings.map((b) => (
                <li key={b.id} className={styles.booking}>
                  <div className={styles.bTop}>
                    <strong>{b.service}</strong>
                    <span className={b.status === "Cancelled" ? `${styles.status} ${styles.cancelled}` : styles.status}>
                      {b.status}
                    </span>
                  </div>
                  <p>{b.device} · {b.dateLabel}, {b.slot}</p>
                  <p className={styles.bMeta}>
                    {b.mode === "pickup" ? "Doorstep pickup" : "Visit shop"} · ID {b.id}
                  </p>
                  {b.status === "Booked" ? (
                    <button type="button" className={styles.cancel} onClick={() => cancelBooking(b.id)}>
                      Cancel booking
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.none}>No bookings yet. Pick a service above to book your first repair.</p>
          )}
        </section>
      </main>

      {active ? (
        <RepairBooking service={active} onClose={() => setActive(null)} onBooked={saveBooking} />
      ) : null}

      <BottomNav cartCount={count} />
    </>
  );
}
