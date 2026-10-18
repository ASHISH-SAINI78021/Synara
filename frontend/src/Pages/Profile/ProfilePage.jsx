// src/pages/Profile/ProfilePage.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Pencil, ShoppingCart, Wrench, Heart, Package, MapPin, Headset,
  Info, FileText, LogOut, ChevronRight, Plus, Trash2, User,
} from "lucide-react";
import { useCart } from "../../Context/CartContext";
import Header from "../../Components/Home/Header/Header.jsx";
import BottomNav from "../../Components/Home/BottomNav/BottomNav.jsx";
import styles from "./Profile.module.css";

const DEFAULT_PROFILE = { name: "", phone: "", email: "" };
const DEFAULT_ADDRESSES = [{ id: "a1", label: "Home", text: "Safidon, Haryana", isDefault: true }];

// small helper: state that is also saved in the browser
function useStored(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage blocked: still works for this session */
    }
  }, [key, value]);
  return [value, setValue];
}

// menu rows: `to` = real page, no `to` = "Soon"
const MENU = [
  { label: "My orders", Icon: Package },
  { label: "Repair bookings", Icon: Wrench, to: "/repairs" },
  { label: "Wishlist", Icon: Heart },
  { label: "Help & support", Icon: Headset },
  { label: "About Synara", Icon: Info },
  { label: "Terms & privacy", Icon: FileText },
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const { count } = useCart();

  const [profile, setProfile] = useStored("synara-profile", DEFAULT_PROFILE);
  const [addresses, setAddresses] = useStored("synara-addresses", DEFAULT_ADDRESSES);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);
  const [error, setError] = useState("");

  const [adding, setAdding] = useState(false);
  const [newAddr, setNewAddr] = useState({ label: "Home", text: "" });

  const startEdit = () => {
    setDraft(profile);
    setError("");
    setEditing(true);
  };

  const saveProfile = (e) => {
    e.preventDefault();
    if (draft.phone && !/^\d{10}$/.test(draft.phone)) {
      setError("Enter a 10-digit mobile number");
      return;
    }
    setProfile({ ...draft, name: draft.name.trim(), email: draft.email.trim() });
    setEditing(false);
  };

  const addAddress = (e) => {
    e.preventDefault();
    const text = newAddr.text.trim();
    if (!text) return;
    setAddresses((list) => [
      ...list,
      { id: `a${Date.now()}`, label: newAddr.label, text, isDefault: list.length === 0 },
    ]);
    setNewAddr({ label: "Home", text: "" });
    setAdding(false);
  };

  const makeDefault = (id) =>
    setAddresses((list) => list.map((a) => ({ ...a, isDefault: a.id === id })));

  const removeAddress = (id) =>
    setAddresses((list) => {
      const next = list.filter((a) => a.id !== id);
      if (next.length && !next.some((a) => a.isDefault)) next[0] = { ...next[0], isDefault: true };
      return next;
    });

  const logout = () => {
    setProfile(DEFAULT_PROFILE);
    setAddresses(DEFAULT_ADDRESSES);
    navigate("/");
  };

  const initial = profile.name.trim().charAt(0).toUpperCase();

  return (
    <>
      <Header cartCount={count} />

      <main className={styles.page}>
        {/* ---------- user card ---------- */}
        <section className={styles.userCard}>
          <span className={styles.avatar} aria-hidden="true">
            {initial || <User size={26} />}
          </span>

          {editing ? (
            <form className={styles.form} onSubmit={saveProfile}>
              <label>
                Name
                <input
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="Your name"
                  autoComplete="name"
                />
              </label>
              <label>
                Mobile number
                <input
                  value={draft.phone}
                  onChange={(e) => setDraft({ ...draft, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                  placeholder="10-digit number"
                  inputMode="numeric"
                  autoComplete="tel"
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={draft.email}
                  onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </label>
              {error ? <p className={styles.error} role="alert">{error}</p> : null}
              <div className={styles.formBtns}>
                <button type="submit" className={styles.primary}>Save</button>
                <button type="button" className={styles.ghost} onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </form>
          ) : (
            <>
              <div className={styles.userInfo}>
                <h1>{profile.name || "Guest"}</h1>
                <p>{profile.phone ? `+91 ${profile.phone}` : "Add your mobile number"}</p>
                {profile.email ? <p>{profile.email}</p> : null}
              </div>
              <button type="button" className={styles.editBtn} onClick={startEdit} aria-label="Edit profile">
                <Pencil size={16} />
              </button>
            </>
          )}
        </section>

        {/* ---------- quick tiles ---------- */}
        <section className={styles.tiles}>
          <Link to="/cart" className={styles.tile}>
            <span className={styles.tileIcon}><ShoppingCart size={20} aria-hidden="true" /></span>
            <strong>{count}</strong>
            <span>In cart</span>
          </Link>
          <Link to="/repairs" className={styles.tile}>
            <span className={styles.tileIcon}><Wrench size={20} aria-hidden="true" /></span>
            <strong>Book</strong>
            <span>Repair</span>
          </Link>
          <Link to="/home" className={styles.tile}>
            <span className={styles.tileIcon}><Package size={20} aria-hidden="true" /></span>
            <strong>Shop</strong>
            <span>Products</span>
          </Link>
        </section>

        {/* ---------- addresses ---------- */}
        <section className={styles.card}>
          <div className={styles.cardHead}>
            <h2><MapPin size={18} aria-hidden="true" /> Saved addresses</h2>
            {!adding ? (
              <button type="button" className={styles.linkBtn} onClick={() => setAdding(true)}>
                <Plus size={14} aria-hidden="true" /> Add new
              </button>
            ) : null}
          </div>

          <ul className={styles.addrList}>
            {addresses.map((a) => (
              <li key={a.id} className={styles.addr}>
                <div className={styles.addrText}>
                  <strong>
                    {a.label}
                    {a.isDefault ? <span className={styles.badge}>Default</span> : null}
                  </strong>
                  <span>{a.text}</span>
                </div>
                <div className={styles.addrBtns}>
                  {!a.isDefault ? (
                    <button type="button" className={styles.linkBtn} onClick={() => makeDefault(a.id)}>
                      Make default
                    </button>
                  ) : null}
                  {addresses.length > 1 ? (
                    <button
                      type="button"
                      className={styles.iconBtn}
                      aria-label={`Delete ${a.label} address`}
                      onClick={() => removeAddress(a.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>

          {adding ? (
            <form className={styles.form} onSubmit={addAddress}>
              <label>
                Type
                <select value={newAddr.label} onChange={(e) => setNewAddr({ ...newAddr, label: e.target.value })}>
                  <option>Home</option>
                  <option>Work</option>
                  <option>Other</option>
                </select>
              </label>
              <label>
                Full address
                <textarea
                  rows={2}
                  value={newAddr.text}
                  onChange={(e) => setNewAddr({ ...newAddr, text: e.target.value })}
                  placeholder="House no, street, area, city, pincode"
                />
              </label>
              <div className={styles.formBtns}>
                <button type="submit" className={styles.primary}>Save address</button>
                <button type="button" className={styles.ghost} onClick={() => setAdding(false)}>Cancel</button>
              </div>
            </form>
          ) : null}
        </section>

        {/* ---------- menu ---------- */}
        <section className={styles.card}>
          <ul className={styles.menu}>
            {MENU.map(({ label, Icon, to }) => (
              <li key={label}>
                {to ? (
                  <Link to={to} className={styles.menuRow}>
                    <span className={styles.menuIcon}><Icon size={18} aria-hidden="true" /></span>
                    <span className={styles.menuLabel}>{label}</span>
                    <ChevronRight size={18} aria-hidden="true" />
                  </Link>
                ) : (
                  <button type="button" className={styles.menuRow} disabled>
                    <span className={styles.menuIcon}><Icon size={18} aria-hidden="true" /></span>
                    <span className={styles.menuLabel}>{label}</span>
                    <span className={styles.soon}>Soon</span>
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>

        <button type="button" className={styles.logout} onClick={logout}>
          <LogOut size={18} aria-hidden="true" /> Log out
        </button>
        <p className={styles.version}>Synara · Electronics, Repairs, At Your Doorstep</p>
      </main>

      <BottomNav cartCount={count} />
    </>
  );
}