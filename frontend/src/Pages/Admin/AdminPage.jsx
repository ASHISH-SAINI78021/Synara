
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  Wrench,
  CalendarCheck,
  LogOut,
  Store,
  Lock,
  Bike,
  BarChart3,
  Tags,
} from "lucide-react";

import { api } from "../../lib/api";
import ProductsTab from "./ProductsTab.jsx";
import ServicesTab from "./ServicesTab.jsx";
import BookingsTab from "./BookingsTab.jsx";
import AnalyticsTab from "./AnalyticsTab.jsx";
import RidersTab from "./RidersTab.jsx";
import CategoriesTab from "./CategoriesTab.jsx";
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

  // Keep the admin page out of search engines.
  useEffect(() => {
    document.title = "Synara Admin";

    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex";
    document.head.appendChild(meta);

    return () => {
      meta.remove();
    };
  }, []);

  // Clean up notification timers.
  useEffect(() => {
    return () => clearTimeout(toastTimer.current);
  }, []);

  const notify = useCallback((message) => {
    setToast(message);

    clearTimeout(toastTimer.current);

    toastTimer.current = setTimeout(() => {
      setToast("");
    }, 3500);
  }, []);

  const logout = useCallback(() => {
    try {
      sessionStorage.removeItem(STORE_KEY);
    } catch {
      // Session storage might be unavailable.
    }

    setKey("");
    setAuthed(false);
    setStats(null);
    setTab("products");
    setLoginError("");
  }, []);

  // All admin API requests use the existing admin-key authentication.
  const call = useCallback(
    async (path, opts = {}) => {
      try {
        return await api(path, {
          ...opts,
          headers: {
            ...(opts.headers || {}),
            "x-admin-key": key,
          },
        });
      } catch (error) {
        if (error.status === 401) {
          logout();
        }

        throw error;
      }
    },
    [key, logout]
  );

  const loadStats = useCallback(async () => {
    try {
      const result = await call("/admin/stats");
      setStats(result);
    } catch {
      // Keep the dashboard available if summary stats fail.
    }
  }, [call]);

  // Validate a previously saved admin key.
  useEffect(() => {
    if (!key || authed) {
      if (!key) setChecking(false);
      return;
    }

    let alive = true;

    api("/admin/check", {
      headers: { "x-admin-key": key },
    })
      .then(() => {
        if (alive) setAuthed(true);
      })
      .catch(() => {
        if (alive) logout();
      })
      .finally(() => {
        if (alive) setChecking(false);
      });

    return () => {
      alive = false;
    };
  }, [key, authed, logout]);

  // Load dashboard summary after authentication.
  useEffect(() => {
    if (authed) {
      loadStats();
    }
  }, [authed, loadStats]);

  const login = async (event) => {
    event.preventDefault();

    const adminKey = input.trim();

    if (!adminKey || busy) return;

    setBusy(true);
    setLoginError("");

    try {
      await api("/admin/check", {
        headers: { "x-admin-key": adminKey },
      });

      try {
        sessionStorage.setItem(STORE_KEY, adminKey);
      } catch {
        // The current session can still continue.
      }

      setKey(adminKey);
      setAuthed(true);
      setInput("");
    } catch (error) {
      setLoginError(
        error.status === 401
          ? "Wrong key"
          : error.status === 429
            ? error.message
            : "Cannot reach the server. Is the backend running?"
      );
    } finally {
      setBusy(false);
    }
  };

  // Login screen.
  if (!authed) {
    return (
      <main className={styles.loginPage}>
        {checking ? (
          <p className={styles.checking}>Checking…</p>
        ) : (
          <form className={styles.loginCard} onSubmit={login}>
            <span className={styles.lock}>
              <Lock size={22} aria-hidden="true" />
            </span>

            <h1>Synara Admin</h1>
            <p>Enter the admin key to continue.</p>

            <input
              type="password"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Admin key"
              aria-label="Admin key"
              autoComplete="current-password"
              autoFocus
            />

            {loginError ? (
              <p className={styles.error} role="alert">
                {loginError}
              </p>
            ) : null}

            <button
              type="submit"
              className={styles.primary}
              disabled={busy || !input.trim()}
            >
              {busy ? "Checking…" : "Sign in"}
            </button>

            <Link to="/home" className={styles.backLink}>
              Back to the shop
            </Link>
          </form>
        )}
      </main>
    );
  }

  const openBookings = stats?.bookings?.Booked ?? "–";

  // Preserve all five admin sections.
  const TABS = [
    {
      id: "products",
      label: "Products",
      Icon: Package,
    },
    {
      id: "services",
      label: "Repair services",
      Icon: Wrench,
    },
    {
      id: "bookings",
      label: `Bookings${
        stats?.bookings?.Booked
          ? ` (${stats.bookings.Booked})`
          : ""
      }`,
      Icon: CalendarCheck,
    },
    {
      id: "analytics",
      label: "Insights",
      Icon: BarChart3,
    },
    {
      id: "riders",
      label: "Riders & deliveries",
      Icon: Bike,
    },
    {
  id: "categories",
  label: "Categories",
  Icon: Tags,
},
  ];

  return (
    <div className={styles.shell}>
      <header className={styles.top}>
        <div className={styles.topInner}>
          <strong className={styles.brand}>Synara Admin</strong>

          <div className={styles.topBtns}>
            <Link to="/home" className={styles.topLink}>
              <Store size={16} aria-hidden="true" />
              <span>View shop</span>
            </Link>

            <button
              type="button"
              className={styles.topLink}
              onClick={logout}
            >
              <LogOut size={16} aria-hidden="true" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <strong>{stats?.products ?? "–"}</strong>
            <span>Products</span>
          </div>

          <div className={styles.stat}>
            <strong>{stats?.repairs ?? "–"}</strong>
            <span>Repair services</span>
          </div>

          <div className={`${styles.stat} ${styles.hot}`}>
            <strong>{openBookings}</strong>
            <span>Open bookings</span>
          </div>
        </div>

        <nav className={styles.tabs} aria-label="Admin sections">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              aria-current={tab === id ? "page" : undefined}
              className={
                tab === id
                  ? `${styles.tab} ${styles.tabOn}`
                  : styles.tab
              }
              onClick={() => setTab(id)}
            >
              <Icon size={16} aria-hidden="true" />
              {label}
            </button>
          ))}
        </nav>

        {tab === "products" && (
          <ProductsTab
            call={call}
            notify={notify}
            onChange={loadStats}
          />
        )}

        {tab === "services" && (
          <ServicesTab
            call={call}
            notify={notify}
            onChange={loadStats}
          />
        )}

        {tab === "bookings" && (
          <BookingsTab
            call={call}
            notify={notify}
            onChange={loadStats}
          />
        )}

        {tab === "analytics" && (
          <AnalyticsTab call={call} />
        )}

        {tab === "riders" && (
          <RidersTab
            call={call}
            notify={notify}
            onChange={loadStats}
          />
        )}

        {tab === "categories" && (
  <CategoriesTab
    call={call}
    notify={notify}
    onChange={loadStats}
  />
)}
      </main>

      {toast && (
        <div className={styles.toast} role="status">
          {toast}
        </div>
      )}
    </div>
  );
}