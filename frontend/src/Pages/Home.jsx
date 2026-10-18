import { useState } from "react";
import { Zap, Headphones } from "lucide-react";
import Header from "../Components/Home/Header/Header.jsx";
import HeroBanner from "../Components/Home/HeroBanner/HeroBanner.jsx";
import ProductSection from "../Components/Home/ProductSection/ProductSection.jsx";
import RepairSection from "../Components/Home/RepairSection/RepairSection.jsx";
import DealsSection from "../Components/Home/DealsSection/DealsSection.jsx";
import BottomNav from "../Components/Home/BottomNav/BottomNav.jsx";
import CategoryGrid from "../Components/CategoryGrid/CategoryGrid.jsx";
import { slides, popular, accessories, repairs, deals, categoryGroups } from "../data/homeData.js";
import styles from "./Home.module.css";

export default function Home() {
  const [cartCount, setCartCount] = useState(0);
  const addToCart = () => setCartCount((c) => c + 1); // replace with real cart logic

  return (
    <div className={styles.page}>
      <Header cartCount={cartCount} />
      <main className={styles.main}>
        <HeroBanner slides={slides} />
        <CategoryGrid groups={categoryGroups} />
        <ProductSection icon={<Zap size={26} fill="currentColor" />} title="Popular Electronics" to="/categories" products={popular} onAdd={addToCart} />
        <ProductSection icon={<Headphones size={26} />} title="Accessories" to="/categories" products={accessories} onAdd={addToCart} />
        <RepairSection services={repairs} />
        <DealsSection deals={deals} />
      </main>
      <BottomNav cartCount={cartCount} />
    </div>
  );
}
