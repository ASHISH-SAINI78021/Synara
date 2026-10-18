// src/pages/Repairs/RepairBooking.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { X, CheckCircle2, Truck, Store } from "lucide-react";
import useStored from "../../hooks/useStored";
import styles from "./RepairBooking.module.css";

const SHOP_ADDRESS = "Synara Store, Safidon, Haryana"; // sample: put your real shop address here
const SLOTS = [
  { id: "10-12", label: "10 AM – 12 PM", start: 10 },
  { id: "12-14", label: "12 PM – 2 PM", start: 12 },
  { id: "14-16", label: "2 PM – 4 PM", start: 14 },
  { id: "16-18", label: "4 PM – 6 PM", start: 16 },
];

const pad = (n) => String(n).padStart(2, "0");
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function nextDays(n = 7) {
  const t = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(t.getFullYear(), t.getMonth(), t.getDate() + i);
    return {
      iso: toISO(d),
      top: i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en-IN", { weekday: "short" }),
      sub: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    };
  });
}

const inr = (n) => (typeof n === "number" ? `₹${n.toLocaleString("en-IN")}` : "");

export default function RepairBooking({ service, onClose, onBooked }) {
  const [profile] = useStored("synara-profile", {});
  const [addresses] = useStored("synara-addresses", []);
  const days = useMemo(() => nextDays(7), []);
  const firstRef = useRef(null);

  const tags = Array.isArray(service.tags) ? service.tags : String(service.tags || "").split(/[•·]/).map((s) => s.trim()).filter(Boolean);
  const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];

  const [device, setDevice] = useState("");
  const [issues, setIssues] = useState([]);
  const [notes, setNotes] = useState("");
  const [mode, setMode] = useState("pickup"); // pickup | shop
  const [date, setDate] = useState(days[0].iso);
  const [slot, setSlot] = useState("");
  const [addrChoice, setAddrChoice] = useState(defaultAddr ? defaultAddr.id : "other");
  const [customAddr, setCustomAddr] = useState("");
  const [name, setName] = useState(profile.name || "");
  const [phone, setPhone] = useState(profile.phone || "");
  const [errors, setErrors] = useState({});
  const [done, setDone] = useState(null);

  // Esc closes, page behind does not scroll, first field gets focus
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    firstRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const nowHour = new Date().getHours();
  const slotDisabled = (s) => date === days[0].iso && nowHour >= s.start;

  const toggleIssue = (t) =>
    setIssues((list) => (list.includes(t) ? list.filter((x) => x !== t) : [...list, t]));

  const submit = (e) => {
    e.preventDefault();
    const err = {};
    if (!device.trim()) err.device = "Tell us the brand and model";
    if (!issues.length && !notes.trim()) err.issues = "Pick at least one problem or describe it";
    if (!slot) err.slot = "Choose a time slot";
    if (!name.trim()) err.name = "Enter your name";
    if (!/^\d{10}$/.test(phone)) err.phone = "Enter a 10-digit mobile number";
    const addrText =
      mode === "shop"
        ? SHOP_ADDRESS
        : addrChoice === "other"
        ? customAddr.trim()
        : addresses.find((a) => a.id === addrChoice)?.text || "";
    if (mode === "pickup" && !addrText) err.addr = "Enter your pickup address";
    setErrors(err);
    if (Object.keys(err).length) return;

    const d = days.find((x) => x.iso === date);
    const booking = {
      id: `SYN-${Date.now().toString(36).toUpperCase().slice(-6)}`,
      serviceId: service.id,
      service: service.name,
      price: service.price,
      device: device.trim(),
      issues,
      notes: notes.trim(),
      mode,
      date,
      dateLabel: `${d.top === "Today" || d.top === "Tomorrow" ? d.top + ", " : d.top + ", "}${d.sub}`,
      slot: SLOTS.find((s) => s.id === slot).label,
      address: addrText,
      name: name.trim(),
      phone,
      status: "Booked",
      createdAt: Date.now(),
    };
    onBooked(booking);
    setDone(booking);
  };

  return (
    <div className={styles.overlay} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.sheet} role="dialog" aria-modal="true" aria-label={`Book ${service.name}`}>
        <header className={styles.head}>
          <div>
            <h2>{done ? "Booking confirmed" : service.name}</h2>
            {!done ? <p>Starting {inr(service.price)} · final price after inspection</p> : null}
          </div>
          <button type="button" className={styles.close} aria-label="Close" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        {done ? (
          <div className={styles.doneBody}>
            <span className={styles.tick}><CheckCircle2 size={44} aria-hidden="true" /></span>
            <h3>Thank you, {done.name.split(" ")[0]}!</h3>
            <p className={styles.bid}>Booking ID <strong>{done.id}</strong></p>
            <dl className={styles.summary}>
              <div><dt>Service</dt><dd>{done.service}</dd></div>
              <div><dt>Device</dt><dd>{done.device}</dd></div>
              <div><dt>When</dt><dd>{done.dateLabel} · {done.slot}</dd></div>
              <div><dt>{done.mode === "pickup" ? "Pickup from" : "Visit"}</dt><dd>{done.address}</dd></div>
              <div><dt>Phone</dt><dd>+91 {done.phone}</dd></div>
            </dl>
            <p className={styles.fine}>We will call you on this number to confirm.</p>
            <button type="button" className={styles.primary} onClick={onClose}>Done</button>
            <Link to="/home" className={styles.linkBtn}>Continue shopping</Link>
          </div>
        ) : (
          <form className={styles.body} onSubmit={submit} noValidate>
            {/* device */}
            <label className={styles.field}>
              <span>Device brand &amp; model</span>
              <input
                ref={firstRef}
                value={device}
                onChange={(e) => setDevice(e.target.value)}
                placeholder="e.g. Samsung Galaxy A55"
                aria-invalid={Boolean(errors.device)}
              />
              {errors.device ? <small role="alert">{errors.device}</small> : null}
            </label>

            {/* issues */}
            <fieldset className={styles.group}>
              <legend>What is the problem?</legend>
              <div className={styles.chips}>
                {[...tags, "Other"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={issues.includes(t) ? `${styles.chip} ${styles.on}` : styles.chip}
                    aria-pressed={issues.includes(t)}
                    onClick={() => toggleIssue(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything else we should know? (optional)"
                aria-label="Extra details"
              />
              {errors.issues ? <small role="alert">{errors.issues}</small> : null}
            </fieldset>

            {/* mode */}
            <fieldset className={styles.group}>
              <legend>How should we repair it?</legend>
              <div className={styles.modes}>
                <button
                  type="button"
                  className={mode === "pickup" ? `${styles.mode} ${styles.on}` : styles.mode}
                  aria-pressed={mode === "pickup"}
                  onClick={() => setMode("pickup")}
                >
                  <Truck size={18} aria-hidden="true" />
                  <strong>Doorstep pickup</strong>
                  <span>We collect &amp; return it</span>
                </button>
                <button
                  type="button"
                  className={mode === "shop" ? `${styles.mode} ${styles.on}` : styles.mode}
                  aria-pressed={mode === "shop"}
                  onClick={() => setMode("shop")}
                >
                  <Store size={18} aria-hidden="true" />
                  <strong>Visit our shop</strong>
                  <span>Drop it in yourself</span>
                </button>
              </div>
            </fieldset>

            {/* date + slot */}
            <fieldset className={styles.group}>
              <legend>Pick a day</legend>
              <div className={styles.days}>
                {days.map((d) => (
                  <button
                    key={d.iso}
                    type="button"
                    className={date === d.iso ? `${styles.day} ${styles.on}` : styles.day}
                    aria-pressed={date === d.iso}
                    onClick={() => { setDate(d.iso); setSlot(""); }}
                  >
                    <strong>{d.top}</strong>
                    <span>{d.sub}</span>
                  </button>
                ))}
              </div>
              <div className={styles.chips}>
                {SLOTS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    disabled={slotDisabled(s)}
                    className={slot === s.id ? `${styles.chip} ${styles.on}` : styles.chip}
                    aria-pressed={slot === s.id}
                    onClick={() => setSlot(s.id)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              {errors.slot ? <small role="alert">{errors.slot}</small> : null}
            </fieldset>

            {/* address */}
            {mode === "pickup" ? (
              <div className={styles.field}>
                <span>Pickup address</span>
                {addresses.length ? (
                  <select value={addrChoice} onChange={(e) => setAddrChoice(e.target.value)} aria-label="Saved addresses">
                    {addresses.map((a) => (
                      <option key={a.id} value={a.id}>{a.label}: {a.text}</option>
                    ))}
                    <option value="other">Use a different address…</option>
                  </select>
                ) : null}
                {addrChoice === "other" || !addresses.length ? (
                  <textarea
                    rows={2}
                    value={customAddr}
                    onChange={(e) => setCustomAddr(e.target.value)}
                    placeholder="House no, street, area, city, pincode"
                    aria-label="Pickup address"
                  />
                ) : null}
                {errors.addr ? <small role="alert">{errors.addr}</small> : null}
              </div>
            ) : (
              <p className={styles.shopNote}><Store size={16} aria-hidden="true" /> {SHOP_ADDRESS}</p>
            )}

            {/* contact */}
            <div className={styles.two}>
              <label className={styles.field}>
                <span>Your name</span>
                <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" aria-invalid={Boolean(errors.name)} />
                {errors.name ? <small role="alert">{errors.name}</small> : null}
              </label>
              <label className={styles.field}>
                <span>Mobile number</span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  inputMode="numeric"
                  autoComplete="tel"
                  aria-invalid={Boolean(errors.phone)}
                />
                {errors.phone ? <small role="alert">{errors.phone}</small> : null}
              </label>
            </div>

            <button type="submit" className={styles.primary}>Confirm booking</button>
          </form>
        )}
      </div>
    </div>
  );
}
