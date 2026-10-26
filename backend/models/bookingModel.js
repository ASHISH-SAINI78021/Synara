// Existing repair booking schema extended with a separate delivery lifecycle.
import mongoose from "mongoose";
const deliverySchema = new mongoose.Schema({
  rider: { type: mongoose.Schema.Types.ObjectId, ref: "Rider", default: null },
  riderId: { type: String, default: null },
  status: { type: String, enum: ["open", "assigned", "picked_up", "at_shop", "returning", "delivered", "cancelled"], default: "open" },
  zone: { type: String, default: "" }, assignedAt: Date, pickedUpAt: Date, deliveredAt: Date,
  distanceKm: { type: Number, min: 0 }, riderPayout: { type: Number, min: 0, default: 0 },
  proof: { publicId: String, resourceType: { type: String, enum: ["image", "raw"] }, format: String },
  riderLocation: { lat: Number, lng: Number, updatedAt: Date },
}, { _id: false });
const bookingSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // custom public booking ID
  serviceId: String,
  service: { type: String, required: true },
  price: Number,
  device: { type: String, required: true },
  issues: [String],
  notes: String,
  mode: { type: String, enum: ["pickup", "shop"], required: true },
  date: { type: String, required: true },
  dateLabel: String,
  slot: { type: String, required: true },
  address: { type: String, required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  status: { type: String, enum: ["Booked", "Completed", "Cancelled"], default: "Booked" },
  delivery: { type: deliverySchema, default: () => ({}) },
}, { timestamps: true });
export const Booking = mongoose.model("Booking", bookingSchema);
