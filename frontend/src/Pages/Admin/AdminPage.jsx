// src/Pages/Admin/AdminPage.jsx
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Package, Wrench, CalendarCheck, LogOut, Store, Lock } from "lucide-react";
import { api } from "../../lib/api";
import ProductsTab from "./ProductsTab.jsx";
import ServicesTab from "./ServicesTab.jsx";
import BookingsTab from "./BookingsTab.jsx";
import styles from "./Admin.module.css";

const STORE_KEY = "synara-admin-key";

const readKey = () => {
  try {
    return sessionStorage.getItem(STORE_KEY) || "";
  } catch {
    return "";
  }
};

export default function AdminPage() {
  const [key, setKey] = useState(readKey);
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(Boolean(readKey()));
  const [input, setInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("products");
  const [stats, setStats] = useState(null);
  const [toast, setToast] = useState("");
  const toastTimer = useRef(null);

  // keep this page out of search engines
  useEffect(() => {
    document.title = "Synara Admin";
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  const notify = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 3500);
  }, []);

  const logout = useCallback(() => {
    try {
      sessionStorage.removeItem(STORE_KEY);
    } catch {
      /* ignore */
    }
    setKey("");
    setAuthed(false);
    setStats(null);
  }, []);

  // every admin request goes through here (adds the key, logs out if the key stops working)
  const call = useCallback(
    async (path, opts = {}) => {
      try {
        return await api(path, { ...opts, headers: { "x-admin-key": key } });
      } catch (err) {
        if (err.status === 401) logout();
        throw err;
      }
    },
    [key, logout]
  );

  const loadStats = useCallback(async () => {
    try {
      setStats(await call("/admin/stats"));
    } catch {
      /* the cards just stay empty */
    }
  }, [call]);

  // a key saved from earlier in this browser tab: check that it still works
  useEffect(() => {
    if (!key || authed) return;
    let alive = true;
    api("/admin/check", { headers: { "x-admin-key": key } })
      .then(() => alive && setAuthed(true))
      .catch(() => alive && logout())
      .finally(() => alive && setChecking(false));
    return () => {
      alive = false;
    };
  }, [key, authed, logout]);

  useEffect(() => {
    if (authed) loadStats();
  }, [authed, loadStats]);

  const login = async (e) => {
    e.preventDefault();
    const k = input.trim();
    if (!k) return;
    setBusy(true);
    setLoginError("");
    try {
      await api("/admin/check", { headers: { "x-admin-key": k } });
      try {
        sessionStorage.setItem(STORE_KEY, k);
      } catch {
        /* ignore */
      }
      setKey(k);
      setAuthed(true);
      setInput("");
    } catch (err) {
      setLoginError(
        err.status === 401 ? "Wrong key" : err.status === 429 ? err.message : "Cannot reach the server. Is the backend running?"
      );
    } finally {
      setBusy(false);
    }
  };

  /* ---------- login screen ---------- */
  if (!authed) {
    return (
      <main className={styles.loginPage}>
        {checking ? (
          <p className={styles.checking}>Checking…</p>
        ) : (
          <form className={styles.loginCard} onSubmit={login}>
            <span className={styles.lock}><Lock size={22} aria-hidden="true" /></span>
            <h1>Synara Admin</h1>
            <p>Enter the admin key to continue.</p>
            <input
              type="password"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Admin key"
              aria-label="Admin key"
              autoComplete="off"
              autoFocus
            />
            {loginError ? <p className={styles.error} role="alert">{loginError}</p> : null}
            <button type="submit" className={styles.primary} disabled={busy || !input.trim()}>
              {busy ? "Checking…" : "Sign in"}
            </button>
            <Link to="/home" className={styles.backLink}>Back to the shop</Link>
          </form>
        )}
      </main>
    );
  }

  /* ---------- admin ---------- */
  const open = stats?.bookings?.Booked ?? "–";
  const TABS = [
    { id: "products", label: "Products", Icon: Package },
    { id: "services", label: "Repair services", Icon: Wrench },
    { id: "bookings", label: `Bookings${stats?.bookings?.Booked ? ` (${stats.bookings.Booked})` : ""}`, Icon: CalendarCheck },
  ];

  return (
    <div className={styles.shell}>
      <header className={styles.top}>
        <div className={styles.topInner}>
          <strong className={styles.brand}>Synara Admin</strong>
          <div className={styles.topBtns}>
            <Link to="/home" className={styles.topLink}><Store size={16} aria-hidden="true" /> <span>View shop</span></Link>
            <button type="button" className={styles.topLink} onClick={logout}><LogOut size={16} aria-hidden="true" /> <span>Log out</span></button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.stats}>
          <div className={styles.stat}><strong>{stats?.products ?? "–"}</strong><span>Products</span></div>
          <div className={styles.stat}><strong>{stats?.repairs ?? "–"}</strong><span>Repair services</span></div>
          <div className={`${styles.stat} ${styles.hot}`}><strong>{open}</strong><span>Open bookings</span></div>
        </div>

        <nav className={styles.tabs} aria-label="Admin sections">
          {TABS.map(({ id, label, Icon }) => (
            <button key={id} type="button" aria-current={tab === id ? "page" : undefined} className={tab === id ? `${styles.tab} ${styles.tabOn}` : styles.tab} onClick={() => setTab(id)}>
              <Icon size={16} aria-hidden="true" /> {label}
            </button>
          ))}
        </nav>

        {tab === "products" ? <ProductsTab call={call} notify={notify} onChange={loadStats} /> : null}
        {tab === "services" ? <ServicesTab call={call} notify={notify} onChange={loadStats} /> : null}
        {tab === "bookings" ? <BookingsTab call={call} notify={notify} onChange={loadStats} /> : null}
      </main>

      {toast ? <div className={styles.toast} role="status">{toast}</div> : null}
    </div>
  );
}
