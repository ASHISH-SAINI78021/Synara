// server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import api from "./routes/api.js";
import bookings from "./routes/bookings.js";
import admin from "./routes/admin.js"; // new admin router

const app = express();

const origins = (process.env.CORS_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({ origin: origins }));
app.use(express.json({ limit: "100kb" }));

app.get("/", (req, res) => res.json({ ok: true, name: "Synara API" }));
app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/admin", admin); // mount admin routes
app.use("/api/bookings", bookings);
app.use("/api", api);

// unknown URL
app.use((req, res) => res.status(404).json({ error: "Not found" }));

// any crash inside a route ends up here instead of killing the server (Express 5 forwards async errors)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`Synara API running on http://localhost:${PORT}`));
});
