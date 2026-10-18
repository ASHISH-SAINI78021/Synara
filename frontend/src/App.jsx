import { Routes, Route } from "react-router-dom";
import SplashPage from "./Components/SplashPage/SplashPage.jsx";
import Home from "./Pages/Home.jsx";
import Product from "./Pages/Product/Product.jsx";
import CartPage from "./Pages/Cart/CartPage.jsx";
import ProfilePage from "./Pages/Profile/ProfilePage.jsx";
import CategoriesPage from "./Pages/Categories/CategoriesPage.jsx";
import CategoryListingPage from "./Pages/CategoryListingPage/CategoryListingPage.jsx";
import RepairsPage from "./pages/Repairs/RepairsPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SplashPage />} />
      <Route path="/home" element={<Home />} />
      <Route path="/product/:id" element={<Product />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/categories" element={<CategoriesPage />} />
      <Route path="/categories/:slug" element={<CategoryListingPage />} />
      <Route path="/repairs" element={<RepairsPage />} />

    </Routes>
  );
}