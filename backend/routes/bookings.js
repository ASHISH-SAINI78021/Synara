// routes/bookings.js  (mounted at /api/bookings)
import { Router } from "express";
import { Booking } from "../models/bookingModel.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const r = Router();
const HIDE = "-_id -__v";
const s = (v, max = 300) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// PUBLIC: the repair form sends a booking here
r.post("/", async (req, res) => {
  const b = req.body || {};
  // only copy the fields we expect (never trust the whole body)
  const doc = {
    id: s(b.id, 30),
    serviceId: s(b.serviceId, 40),
    service: s(b.service, 120),
    price: Number(b.price) || 0,
    device: s(b.device, 120),
    issues: Array.isArray(b.issues) ? b.issues.slice(0, 12).map((x) => s(x, 60)) : [],
    notes: s(b.notes, 600),
    mode: b.mode,
    date: s(b.date, 10),
    dateLabel: s(b.dateLabel, 60),
    slot: s(b.slot, 40),
    address: s(b.address, 400),
    name: s(b.name, 80),
    phone: s(b.phone, 10),
  };

  const missing = ["id", "service", "device", "date", "slot", "address", "name"].filter((k) => !doc[k]);
  if (missing.length) return res.status(400).json({ error: `Missing: ${missing.join(", ")}` });
  if (!["pickup", "shop"].includes(doc.mode)) return res.status(400).json({ error: "Invalid mode" });
  if (!/^\d{10}$/.test(doc.phone)) return res.status(400).json({ error: "Phone must be 10 digits" });

  try {
    await Booking.create(doc);
    res.status(201).json({ ok: true, id: doc.id });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: "Booking already exists" });
    res.status(400).json({ error: err.message });
  }
});

// PUBLIC: a customer cancels their own booking (must give the same phone number)
r.post("/:id/cancel", async (req, res) => {
  const phone = s(req.body?.phone, 10);
  const booking = await Booking.findOneAndUpdate(
    { id: req.params.id, phone, status: "Booked" },
    { status: "Cancelled" },
    { new: true }
  )
    .select(HIDE)
    .lean();
  if (!booking) return res.status(404).json({ error: "Booking not found" });
  res.json(booking);
});

// OWNER ONLY: see all bookings (newest first), optional ?status=Booked
r.get("/", requireAdmin, async (req, res) => {
  const filter = req.query.status ? { status: req.query.status } : {};
  const list = await Booking.find(filter).sort({ createdAt: -1 }).select(HIDE).lean();
  res.json(list);
});

// OWNER ONLY: mark Completed / Cancelled
r.patch("/:id", requireAdmin, async (req, res) => {
  const status = req.body?.status;
  if (!["Booked", "Completed", "Cancelled"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }
  const booking = await Booking.findOneAndUpdate({ id: req.params.id }, { status }, { new: true })
    .select(HIDE)
    .lean();
  if (!booking) return res.status(404).json({ error: "Not found" });
  res.json(booking);
});

export default r;
