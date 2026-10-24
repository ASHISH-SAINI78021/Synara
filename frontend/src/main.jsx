import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { CartProvider } from "./Context/CartContext";
import { CatalogProvider } from "./Context/CatalogContext";
import App from "./App.jsx";
import "./styles/tokens.css";
import { registerSW } from "virtual:pwa-register";

// Auto-update service worker in the background
registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
  <CatalogProvider>
    <CartProvider>
      <App />
    </CartProvider>
  </CatalogProvider>
</BrowserRouter>
);