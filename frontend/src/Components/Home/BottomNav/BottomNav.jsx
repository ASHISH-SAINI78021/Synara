import { NavLink } from "react-router-dom";
import { Home, LayoutGrid, Wrench, ShoppingCart, User } from "lucide-react";
import styles from "./BottomNav.module.css";

const items = [
  { to: "/home", label: "Home", Icon: Home },
  { to: "/categories", label: "Categories", Icon: LayoutGrid },
  { to: "/repairs", label: "Repairs", Icon: Wrench },
  { to: "/cart", label: "Cart", Icon: ShoppingCart, badge: true },
  { to: "/profile", label: "Profile", Icon: User },
];

export default function BottomNav({ cartCount = 0 }) {
  return (
    <nav className={styles.nav} aria-label="Main">
      <ul className={styles.list}>
        {items.map(({ to, label, Icon, badge }) => (
          <li key={to}>
            <NavLink to={to} className={({ isActive }) => (isActive ? `${styles.item} ${styles.active}` : styles.item)}>
              <span className={styles.icon}>
                <Icon size={24} aria-hidden="true" />
                {badge && cartCount > 0 && <span className={styles.badge}>{cartCount}</span>}
              </span>
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
