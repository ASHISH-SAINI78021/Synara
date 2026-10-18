// src/pages/Cart/CartPage.jsx
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight, Clock, Gift, House, Minus, Plus, ShoppingBag } from "lucide-react";
import { useCart } from "../../Context/CartContext";
import { popular, accessories } from "../../data/homeData";
import SimilarProducts from "../../Components/SimilarProduct/SimilarProducts.jsx";
import styles from "./Cart.module.css";

const inr = (n) => (typeof n === "number" ? `₹${n.toLocaleString("en-IN")}` : "");
const everything = [...popular, ...accessories];

export default function CartPage() {
  const navigate = useNavigate();
  const { items, count, totals, add, updateQty, remove } = useCart();

  const inCart = new Set(items.map((i) => i.id));
  const notInCart = everything.filter((p) => !inCart.has(p.id));

  // "Special deal": the cheapest product (under ₹500) that is not in the cart yet
  const deal = notInCart.filter((p) => p.price <= 500).sort((a, b) => a.price - b.price)[0];

  // "You might also like": best rated products not in the cart, without the deal item
  const suggestions = notInCart
    .filter((p) => p.id !== deal?.id)
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 6);

  const topbar = (
    <header className={styles.topbar}>
      <button type="button" className={styles.back} aria-label="Go back" onClick={() => navigate(-1)}>
        <ArrowLeft size={20} />
      </button>
      <h1 className={styles.topTitle}>Checkout</h1>
      {count > 0 ? <span className={styles.topCount}>{count} {count === 1 ? "item" : "items"}</span> : null}
    </header>
  );

  /* ---------- empty cart ---------- */
  if (items.length === 0) {
    return (
      <div className={styles.page}>
        {topbar}
        <section className={styles.empty}>
          <span className={styles.emptyIcon}><ShoppingBag size={40} aria-hidden="true" /></span>
          <h2>Your cart is empty</h2>
          <p>Add phones, chargers, earbuds and more to get started.</p>
          <Link to="/home" className={styles.shopBtn}>Start shopping</Link>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {topbar}

      {/* ---------- special deal ---------- */}
      {deal ? (
        <section className={styles.card}>
          <h2 className={styles.heading}>Special deal for you!</h2>
          <div className={styles.dealBox}>
            <div className={styles.dealRow}>
              <Link to={`/product/${deal.id}`} className={styles.thumb} aria-label={deal.name}>
                {deal.image ? <img src={deal.image} alt="" /> : <span aria-hidden="true">{deal.emoji}</span>}
              </Link>
              <div className={styles.dealInfo}>
                <Link to={`/product/${deal.id}`} className={styles.nameLink}>{deal.name}</Link>
                <p className={styles.dealPrice}>
                  <strong>{inr(deal.price)}</strong>
                  {deal.mrp > deal.price ? <del>{inr(deal.mrp)}</del> : null}
                </p>
              </div>
              <button type="button" className={styles.addBtn} onClick={() => add(deal)}>ADD</button>
            </div>
            <p className={styles.unlock}>
              <span className={styles.unlockIcon}><Gift size={16} aria-hidden="true" /></span>
              <span>Special deal unlocked. <strong>Add this item to your cart</strong></span>
            </p>
          </div>
        </section>
      ) : null}

      {/* ---------- cart items ---------- */}
      <section className={styles.card}>
        <div className={styles.shipHead}>
          <span className={styles.shipIcon}><Clock size={20} aria-hidden="true" /></span>
          <div>
            <h2 className={styles.heading}>
              {totals.delivery === 0 ? "Free same day delivery" : "Same day delivery"}
            </h2>
            <p className={styles.sub}>Shipment of {count} {count === 1 ? "item" : "items"}</p>
          </div>
        </div>

        {totals.toFreeDelivery > 0 ? (
          <p className={styles.nudge}>Add {inr(totals.toFreeDelivery)} more to get free delivery</p>
        ) : null}

        <ul className={styles.items}>
          {items.map((it) => (
            <li key={it.id} className={styles.item}>
              <Link to={`/product/${it.id}`} className={styles.thumb} aria-label={it.name}>
                {it.image ? <img src={it.image} alt="" /> : <span aria-hidden="true">{it.emoji}</span>}
              </Link>

              <div className={styles.itemInfo}>
                <Link to={`/product/${it.id}`} className={styles.nameLink}>{it.name}</Link>
                <span className={styles.unit}>{it.unit || "1 unit"}</span>
                <button type="button" className={styles.removeBtn} onClick={() => remove(it.id)}>
                  Remove
                </button>
              </div>

              <div className={styles.itemSide}>
                <div className={styles.stepper}>
                  <button type="button" aria-label={`Decrease quantity of ${it.name}`} onClick={() => updateQty(it.id, it.qty - 1)}>
                    <Minus size={16} />
                  </button>
                  <span aria-live="polite">{it.qty}</span>
                  <button
                    type="button"
                    aria-label={`Increase quantity of ${it.name}`}
                    onClick={() => updateQty(it.id, it.qty + 1)}
                    disabled={it.qty >= 10}
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <p className={styles.itemPrice}>
                  {it.mrp > it.price ? <del>{inr(it.mrp * it.qty)}</del> : null}
                  <strong>{inr(it.price * it.qty)}</strong>
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* ---------- you might also like ---------- */}
      {suggestions.length ? (
        <SimilarProducts
          title="You might also like"
          items={suggestions}
          seeAll={false}
          onAdd={(p) => add(p)}
        />
      ) : null}

      {/* ---------- bill details ---------- */}
      <section className={styles.card}>
        <h2 className={styles.heading}>Bill details</h2>
        <dl className={styles.bill}>
          <div><dt>Items total (MRP)</dt><dd>{inr(totals.mrpTotal)}</dd></div>
          {totals.savings > 0 ? (
            <div className={styles.green}><dt>Product discount</dt><dd>− {inr(totals.savings)}</dd></div>
          ) : null}
          <div>
            <dt>Delivery charge</dt>
            <dd>{totals.delivery === 0 ? <span className={styles.free}>FREE</span> : inr(totals.delivery)}</dd>
          </div>
          <div className={styles.grand}><dt>Grand total</dt><dd>{inr(totals.grand)}</dd></div>
        </dl>
        {totals.savings > 0 ? (
          <p className={styles.saved}>You are saving {inr(totals.savings)} on this order</p>
        ) : null}
      </section>

      {/* ---------- fixed bottom: address + pay ---------- */}
      <div className={styles.bar}>
        <div className={styles.barInner}>
          <div className={styles.address}>
            <span className={styles.addrIcon}><House size={20} aria-hidden="true" /></span>
            <div className={styles.addrText}>
              <strong>Delivering to Home</strong>
              <span>Safidon, Haryana</span>
            </div>
            <button type="button" className={styles.change}>Change</button>
          </div>

          <button
            type="button"
            className={styles.payBtn}
            onClick={() => {
              /* TODO: go to the payment page when it exists */
            }}
          >
            <span className={styles.payTotal}>
              <strong>{inr(totals.grand)}</strong>
              <small>TOTAL</small>
            </span>
            <span className={styles.payText}>
              Select Payment Method <ChevronRight size={18} aria-hidden="true" />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}