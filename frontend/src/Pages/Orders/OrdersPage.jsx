import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../lib/api.js";
import { resolveImage } from "../../utils/resolveImage.js";
import styles from "./OrdersPage.module.css";

const money = n => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const stages = [
  { key: "open", title: "Order placed", detail: "We've received your order", icon: "✓" },
  { key: "assigned", title: "Rider assigned", detail: "Your delivery partner is assigned", icon: "♙" },
  { key: "picked_up", title: "Order picked up", detail: "Your order is with the rider", icon: "▣" },
  { key: "out_for_delivery", title: "Out for delivery", detail: "Your order is on its way", icon: "➜" },
  { key: "delivered", title: "Delivered", detail: "Enjoy your order!", icon: "✓" },
];
const statusNames = {
  open: "Order placed", assigned: "Rider assigned", picked_up: "Picked up",
  out_for_delivery: "Out for delivery", delivered: "Delivered", cancelled: "Order cancelled",
};
const formatDate = value => value ? new Date(value).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) : "";
const formatTime = value => value ? new Date(value).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }) : "";

function OrderProgress({ order }) {
  const cancelled = order.status === "cancelled";
  const activeIndex = stages.findIndex(stage => stage.key === order.status);
  const events = order.events || [];
  const eventFor = key => [...events].reverse().find(event => event.status === key);
  const timestampFor = key => {
    const event = eventFor(key);
    if (event?.at) return event.at;
    const fallback = { open: order.createdAt, assigned: order.assignedAt, picked_up: order.pickedUpAt, delivered: order.deliveredAt };
    return fallback[key] || null;
  };

  if (cancelled) {
    const cancelledEvent = eventFor("cancelled");
    return <section className={`${styles.progress} ${styles.cancelledProgress}`} aria-label="Order tracking">
      <div className={styles.progressHeading}><span className={styles.cancelIcon}>×</span><div><strong>Order cancelled</strong><p>This order will not be delivered.</p></div></div>
      {cancelledEvent?.at && <p className={styles.stepDate}>Cancelled on {formatDate(cancelledEvent.at)}</p>}
    </section>;
  }

  const currentStage = stages[Math.max(activeIndex, 0)];
  return <section className={styles.progress} aria-label="Order tracking">
    <div className={styles.progressHeading}>
      <div className={styles.progressHeadingText}><span className={styles.eyebrow}>ORDER STATUS</span><h3>{statusNames[order.status] || "Order placed"}</h3><p>{currentStage?.detail || "We're preparing your order."}</p></div>
      <span className={styles.liveBadge}><span /> {order.status === "delivered" ? "Completed" : "In progress"}</span>
    </div>
    <div className={styles.track}>
      {stages.map((stage, index) => {
        const complete = activeIndex >= index;
        const current = activeIndex === index;
        const at = timestampFor(stage.key);
        return <div className={`${styles.trackStep} ${complete ? styles.complete : ""} ${current ? styles.current : ""}`} key={stage.key}>
          <div className={styles.trackRail}><span className={styles.trackDot}>{complete && index < activeIndex ? "✓" : stage.icon}</span>{index < stages.length - 1 && <span className={styles.trackLine} />}</div>
          <div className={styles.trackCopy}><strong>{stage.title}</strong><span>{stage.detail}</span>{at && <time>{formatDate(at)}</time>}</div>
        </div>;
      })}
    </div>
  </section>;
}

export default function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]), [loading, setLoading] = useState(true), [error, setError] = useState(""), [otp, setOtp] = useState({}), [busy, setBusy] = useState({});
  const load = useCallback(async () => { setLoading(true); setError(""); try { setOrders(await api("/orders/mine")); } catch (e) { setError(e.message); } finally { setLoading(false); } }, []);
  useEffect(() => { if (!localStorage.getItem("synara-auth-token")) navigate(`/account?next=${encodeURIComponent("/orders")}`); else load(); }, [navigate, load]);
  const getOtp = async id => { setBusy(p => ({ ...p, [id]: true })); setError(""); try { const data = await api(`/orders/${encodeURIComponent(id)}/delivery-otp`, { method: "POST", body: {} }); setOtp(p => ({ ...p, [id]: data.deliveryOtp })); } catch (e) { setError(e.message); } finally { setBusy(p => ({ ...p, [id]: false })); } };
  const cancel = async id => { if (!window.confirm("Cancel this order? This is only possible before a rider accepts it.")) return; setBusy(p => ({ ...p, [id]: true })); try { await api(`/orders/${encodeURIComponent(id)}/cancel`, { method: "POST", body: {} }); await load(); } catch (e) { setError(e.message); } finally { setBusy(p => ({ ...p, [id]: false })); } };

  return <main className={styles.page}>
    <header className={styles.header}><Link to="/profile" className={styles.backLink}>← Profile</Link><span className={styles.brandMark}>SYNARA <span>ORDERS</span></span><h1>My orders</h1><p>Every order, every update — all in one place.</p></header>
    {error && <p className={styles.error} role="alert">{error}</p>}
    {loading ? <div className={styles.loading}><span className={styles.loader} /> Loading your orders…</div> : orders.length ? <div className={styles.list}>{orders.map(o => <article className={styles.card} key={o.orderId}>
      <div className={styles.orderHeader}><div><span className={styles.orderLabel}>ORDER ID</span><strong className={styles.orderId}>{o.orderId}</strong></div><span className={`${styles.status} ${o.status === "delivered" ? styles.deliveredStatus : ""} ${o.status === "cancelled" ? styles.cancelledStatus : ""}`}>{statusNames[o.status] || String(o.status || "open").replaceAll("_", " ")}</span></div>
      <div className={styles.orderMeta}><span><span className={styles.metaIcon}>▦</span> Placed {formatDate(o.createdAt)}</span><span className={styles.payment}><span className={styles.codDot} /> Cash on delivery</span></div>
      <OrderProgress order={o} />
      <div className={styles.itemsSection}><h3>Items in this order <span>{o.items.length} {o.items.length === 1 ? "item" : "items"}</span></h3><ul className={styles.items}>{o.items.map(i => <li key={i.productId}><Link to={`/product/${encodeURIComponent(i.productId)}`} aria-label={`View ${i.name || "product"}`} style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 0, color: "inherit", textDecoration: "none" }} onClick={event => { if (!i.productId) event.preventDefault(); }}><div className={styles.itemThumb}>{resolveImage(i.image) ? <img src={resolveImage(i.image)} alt={i.name || "Product"} loading="lazy" onError={event => { event.currentTarget.style.display = "none"; const fallback = event.currentTarget.parentElement?.querySelector("[data-image-fallback]"); if (fallback) fallback.style.display = "grid"; }} /> : null}<span data-image-fallback aria-hidden="true" style={{ display: resolveImage(i.image) ? "none" : "grid" }}>▧</span></div><div className={styles.itemDetails}><strong>{i.name}</strong><span>Qty: {i.quantity} × {money(i.unitPrice)}</span><span style={{ fontSize: 12, marginTop: 3, color: "#8a6b00" }}>View product →</span></div></Link><strong className={styles.itemPrice}>{money(i.unitPrice * i.quantity)}</strong></li>)}</ul>
        <div className={styles.totalRow}><span>Order total</span><strong>{money(o.total)}</strong></div>
      </div>
      <div className={styles.deliverySection}><div className={styles.sectionIcon}>⌖</div><div><strong>Delivery address</strong><p>{o.address}</p></div></div>
      {o.riderLocation?.lat != null && o.riderLocation?.lng != null && <div className={styles.riderLink}><span>Rider location available</span><a href={`https://maps.google.com/?q=${o.riderLocation.lat},${o.riderLocation.lng}`} target="_blank" rel="noreferrer">View on map ↗</a>{o.riderLocation.updatedAt && <small>Updated {formatTime(o.riderLocation.updatedAt)}</small>}</div>}
      {o.status !== "delivered" && o.status !== "cancelled" && <div className={styles.actions}><button className={styles.secondary} disabled={busy[o.orderId]} onClick={() => getOtp(o.orderId)}>{busy[o.orderId] ? "Please wait…" : otp[o.orderId] ? "Refresh delivery OTP" : "View delivery OTP"}</button>{o.status === "open" && <button className={styles.cancel} disabled={busy[o.orderId]} onClick={() => cancel(o.orderId)}>Cancel order</button>}</div>}
      {otp[o.orderId] && <div className={styles.otp}><div><span className={styles.otpLabel}>DELIVERY VERIFICATION CODE</span><strong>{otp[o.orderId]}</strong></div><p>Keep this code private. Share it with your rider only when your order arrives.</p></div>}
    </article>)}</div> : <section className={styles.empty}><div className={styles.emptyIcon}>▧</div><h2>No orders yet</h2><p>Your orders and delivery updates will appear here after checkout.</p><Link to="/home" className={styles.shopLink}>Start shopping <span>→</span></Link></section>}
    <footer className={styles.footer}><Link to="/rider">Become a Synara rider</Link><span>·</span><Link to="/home">Continue shopping</Link></footer>
  </main>;
}
