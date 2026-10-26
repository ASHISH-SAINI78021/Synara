import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../../lib/api.js";
import styles from "./AuthPage.module.css";

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const nextParam = new URLSearchParams(location.search).get("next");
  const next = nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/profile";
  const [mode, setMode] = useState(location.pathname === "/register" ? "register" : "login");
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const saveSession = (data) => {
    localStorage.setItem("synara-auth-token", data.token);
    localStorage.setItem("synara-auth-user", JSON.stringify(data.user));
    localStorage.setItem("synara-profile", JSON.stringify({ name: data.user?.name || "", phone: data.user?.phone || "", email: data.user?.email || "" }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = mode === "register"
        ? await api("/auth/register", { method: "POST", body: form })
        : await api("/auth/login", { method: "POST", body: { email: form.email, password: form.password } });
      saveSession(data);
      navigate(next, { replace: true });
    } catch (err) {
      setError(err.message || "Authentication failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <Link className={styles.back} to="/home">← Back to Synara</Link>
        <p className={styles.eyebrow}>SYNARA ACCOUNT</p>
        <h1>{mode === "register" ? "Create your account" : "Welcome back"}</h1>
        <p className={styles.muted}>{mode === "register" ? "Create an account with your email and password to place orders and track deliveries." : "Sign in to place orders, track deliveries and manage your Synara account."}</p>
        <form onSubmit={submit} className={styles.form}>
          {mode === "register" && <>
            <label>Full name
              <input autoComplete="name" value={form.name} onChange={(e) => update("name", e.target.value)} required minLength={2} maxLength={100} />
            </label>
            <label>Mobile number <span className={styles.fieldHint}>(needed for delivery contact)</span>
              <input autoComplete="tel" inputMode="numeric" value={form.phone} onChange={(e) => update("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} required pattern="\d{10}" placeholder="10-digit number" />
            </label>
          </>}
          <label>Email
            <input type="email" autoComplete="email" value={form.email} onChange={(e) => update("email", e.target.value)} required maxLength={200} />
          </label>
          <label>Password
            <input type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} value={form.password} onChange={(e) => update("password", e.target.value)} required minLength={mode === "register" ? 10 : 1} maxLength={128} placeholder={mode === "register" ? "At least 10 characters" : "Your password"} />
          </label>
          {error ? <p role="alert" className={styles.error}>{error}</p> : null}
          <button className={styles.primary} disabled={busy}>{busy ? "Please wait…" : mode === "register" ? "Create account" : "Sign in"}</button>
        </form>
        {mode === "login" ? <p className={styles.switch}>New to Synara? <button onClick={() => { setMode("register"); setError(""); }} type="button">Create an account</button></p> : <p className={styles.switch}>Already registered? <button onClick={() => { setMode("login"); setError(""); }} type="button">Sign in</button></p>}
        <p className={styles.rider}>Deliver with Synara? <Link to="/rider">Rider registration and delivery portal</Link></p>
      </section>
    </main>
  );
}
