import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import styles from "./SectionHeader.module.css";

export default function SectionHeader({ icon, title, linkText = "See all", to = "#" }) {
  return (
    <div className={styles.row}>
      <h2 className={styles.title}>
        <span className={styles.icon} aria-hidden="true">{icon}</span>
        {title}
      </h2>
      <Link to={to} className={styles.link}>
        {linkText} <ChevronRight size={16} aria-hidden="true" />
      </Link>
    </div>
  );
}
