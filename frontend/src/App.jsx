import { Routes, Route } from "react-router-dom";
import SplashPage from "./Components/SplashPage/SplashPage.jsx";
import Home from "./Pages/Home.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SplashPage />} />
      <Route path="/home" element={<Home />} />
      <Route path="/categories" element={<h1>Categories</h1>} />
      <Route path="/repairs" element={<h1>Repairs</h1>} />
      <Route path="/cart" element={<h1>Cart</h1>} />
      <Route path="/profile" element={<h1>Profile</h1>} />
    </Routes>
  );
}