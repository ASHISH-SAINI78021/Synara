// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// where your Express backend runs while you develop (the PORT in backend/.env)
const API_TARGET = "http://localhost:5000";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "favicon-48.png", "apple-touch-icon.png"],
      manifest: {
        name: "Synara",
        short_name: "Synara",
        description: "Electronics • Repairs • At Your Doorstep",
        theme_color: "#ffd600",
        background_color: "#ffd600",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          {
            src: "pwa-maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // precache only the app shell; photos are cached when first viewed
        globPatterns: ["**/*.{js,css,html,ico,woff2}"],
        navigateFallback: "/index.html",
        // never answer API addresses with the app page
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            // product and repair photos: cache each one the first time it loads
            urlPattern: ({ request }) => request.destination === "image",
            handler: "CacheFirst",
            options: {
              cacheName: "images",
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // cache Google Fonts so the app looks right offline
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: "StaleWhileRevalidate",
            options: { cacheName: "google-fonts" },
          },
        ],
      },
    }),
  ],

  // `npm run dev`: requests to /api/... are forwarded to your Express server
  server: {
    proxy: { "/api": API_TARGET },
  },

  // `npm run preview` (testing the production build locally): same forwarding
  preview: {
    proxy: { "/api": API_TARGET },
  },
});