// src/App.jsx
import { Routes, Route } from "react-router-dom";
import CatalogGate from "./Components/CatalogGate/CatalogGate.jsx";
import SplashPage from "./Components/SplashPage/SplashPage.jsx";
import Home from "./Pages/Home.jsx";
import Product from "./Pages/Product/Product.jsx";
import CartPage from "./Pages/Cart/CartPage.jsx";
import ProfilePage from "./Pages/Profile/ProfilePage.jsx";
import CategoriesPage from "./Pages/Categories/CategoriesPage.jsx";
import CategoryListingPage from "./Pages/CategoryListingPage/CategoryListingPage.jsx";
import RepairsPage from "./Pages/Repairs/RepairsPage.jsx";
import IntroPage from "./Pages/Intro/IntroPage.jsx";
import AdminPage from "./Pages/Admin/AdminPage.jsx";
import AuthPage from "./Pages/Auth/AuthPage.jsx";
import RiderPage from "./Pages/Rider/RiderPage.jsx";
import OrdersPage from "./Pages/Orders/OrdersPage.jsx";

export default function App() {
  return (
    <Routes>
      {/* intro and splash stay outside the gate, so the animation plays while the products load */}
      <Route path="/" element={<IntroPage />} />
      <Route path="/welcome" element={<SplashPage />} />

      {/* every page that shows products waits for the data here */}
      <Route element={<CatalogGate />}>
        <Route path="/home" element={<Home />} />
        <Route path="/product/:id" element={<Product />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/categories/:slug" element={<CategoryListingPage />} />
        <Route path="/repairs" element={<RepairsPage />} />
      </Route>

      {/* account, rider delivery portal and admin */}
      {/* Customer authentication: /account defaults to login; /login and /register are direct links */}
      <Route path="/account" element={<AuthPage />} />
      <Route path="/login" element={<AuthPage />} />
      <Route path="/register" element={<AuthPage />} />
      <Route path="/rider" element={<RiderPage />} />
      <Route path="/orders" element={<OrdersPage />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  );
}