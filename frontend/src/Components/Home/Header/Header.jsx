import { Link } from "react-router-dom";
import { MapPin, ChevronDown, Search, User, ShoppingCart } from "lucide-react";
import logo from "../../../assets/synara-logo.png";
import styles from "./Header.module.css";

export default function Header({ location = "Safidon, Haryana", cartCount = 0 }) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/home" className={styles.brand} aria-label="Synara home">
          <img src={logo} alt="Synara" className={styles.logo} />
        </Link>

        <button type="button" className={styles.location}>
          <MapPin size={18} aria-hidden="true" />
          <span className={styles.locText}>
            <strong>{location}</strong>
            <small>Fast &amp; Reliable Delivery</small>
          </span>
          <ChevronDown size={16} aria-hidden="true" />
        </button>

        <label className={styles.search}>
          <Search size={18} aria-hidden="true" />
          <input type="search" placeholder="Search for mobiles, laptops, accessories…" />
        </label>

        <nav className={styles.actions} aria-label="Account">
          <Link to="/profile" className={styles.iconBtn} aria-label="Profile">
            <User size={26} />
          </Link>
          <Link to="/cart" className={styles.iconBtn} aria-label={`Cart, ${cartCount} items`}>
            <ShoppingCart size={26} />
            {cartCount > 0 && <span className={styles.badge}>{cartCount}</span>}
          </Link>
        </nav>
      </div>
    </header>
  );
}
