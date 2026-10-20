// backend/src/index.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import routes from "./routes/routes.js";

const app = express();

app.use(cors({ origin: (process.env.CLIENT_ORIGIN || "").split(",").map((s) => s.trim()) }));
app.use(express.json());

app.get("/", (req, res) => res.json({ ok: true, name: "Synara API" }));
app.use("/api", routes);

app.use((req, res) => res.status(404).json({ error: "Not found" }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

const port = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    app.listen(port, () => console.log(`Synara API running on port ${port}`));
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });