// backend/routes/admin.js
import { Router } from "express";
import { Product } from "../models/productModel.js";
import { Repair } from "../models/repairModel.js";
import { Booking } from "../models/bookingModel.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const r = Router();

// GET /stats - return aggregated admin statistics
r.get("/stats", requireAdmin, async (req, res) => {
  try {
    const [productCount, repairCount, bookings] = await Promise.all([
      Product.countDocuments({}),
      Repair.countDocuments({}),
      Booking.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $project: { status: "$_id", count: 1, _id: 0 } },
      ]),
    ]);

    const bookingStats = bookings.reduce((acc, cur) => {
      acc[cur.status] = cur.count;
      return acc;
    }, {});

    res.json({
      products: productCount,
      repairs: repairCount,
      bookings: bookingStats,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch admin stats" });
  }
});

// GET /check - simple admin key validation
r.get("/check", requireAdmin, (req, res) => {
  res.json({ ok: true });
});

export default r;
