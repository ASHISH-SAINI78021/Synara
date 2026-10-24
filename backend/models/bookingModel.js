// models/bookingModel.js
import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true }, // "SYN-ABC123" (made by the frontend)
    serviceId: String,
    service: { type: String, required: true },
    price: Number,
    device: { type: String, required: true },
    issues: [String],
    notes: String,
    mode: { type: String, enum: ["pickup", "shop"], required: true },
    date: { type: String, required: true }, // 2026-10-24
    dateLabel: String,
    slot: { type: String, required: true },
    address: { type: String, required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    status: { type: String, enum: ["Booked", "Completed", "Cancelled"], default: "Booked" },
  },
  { timestamps: true }
);

export const Booking = mongoose.model("Booking", bookingSchema);
