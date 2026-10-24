// src/Pages/Home.jsx
import { Zap, Headphones } from "lucide-react";
import Header from "../Components/Home/Header/Header.jsx";
import HeroBanner from "../Components/Home/HeroBanner/HeroBanner.jsx";
import ProductSection from "../Components/Home/ProductSection/ProductSection.jsx";
import RepairSection from "../Components/Home/RepairSection/RepairSection.jsx";
import DealsSection from "../Components/Home/DealsSection/DealsSection.jsx";
import BottomNav from "../Components/Home/BottomNav/BottomNav.jsx";
import CategoryGrid from "../Components/CategoryGrid/CategoryGrid.jsx";
import { slides, deals } from "../data/homeData.js"; // banners and deals are not in the database yet
import { useCatalog } from "../Context/CatalogContext";
import { useCart } from "../Context/CartContext";
import styles from "./Home.module.css";

export default function Home() {
  const { count, add } = useCart();
  const { popular, accessories, repairs, categoryGroups } = useCatalog();

  return (
    <div className={styles.page}>
      <Header cartCount={count} />
      <main className={styles.main}>
        <HeroBanner slides={slides} />

        <ProductSection icon={<Zap size={26} fill="currentColor" />} title="Popular Electronics" to="/categories" products={popular} onAdd={add} />
        <ProductSection icon={<Headphones size={26} />} title="Accessories" to="/categories" products={accessories} onAdd={add} />
        <CategoryGrid groups={categoryGroups} />
        <RepairSection services={repairs} />
        <DealsSection deals={deals} />
      </main>
      <BottomNav cartCount={count} />
    </div>
  );
}