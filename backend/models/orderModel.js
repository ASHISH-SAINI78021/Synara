import mongoose from "mongoose";
const orderItemSchema = new mongoose.Schema({
  productId: { type: String, required: true }, name: { type: String, required: true },
  image: String, unitPrice: { type: Number, required: true, min: 0 }, quantity: { type: Number, required: true, min: 1, max: 10 },
}, { _id: false });
const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true, index: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  customerName: { type: String, required: true }, customerPhone: { type: String, required: true },
  items: { type: [orderItemSchema], validate: v => v.length > 0 },
  address: { type: String, required: true, maxlength: 500 }, zone: { type: String, default: "" },
  destination: { lat: { type: Number, min: -90, max: 90 }, lng: { type: Number, min: -180, max: 180 } },
  subtotal: { type: Number, required: true, min: 0 }, deliveryFee: { type: Number, required: true, min: 0 }, total: { type: Number, required: true, min: 0 },
  paymentMethod: { type: String, enum: ["cod"], default: "cod" }, paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
  status: { type: String, enum: ["open", "assigned", "picked_up", "out_for_delivery", "delivered", "cancelled"], default: "open", index: true },
  rider: { type: mongoose.Schema.Types.ObjectId, ref: "Rider", default: null, index: true }, riderId: { type: String, default: null },
  assignedAt: Date, pickedUpAt: Date, deliveredAt: Date, deliveryOtpHash: String,
  deliveryProof: { publicId: String, resourceType: { type: String, enum: ["image", "raw"] }, format: String },
  distanceKm: { type: Number, min: 0 }, riderPayout: { type: Number, min: 0, default: 0 }, payoutSettled: { type: Boolean, default: false },
  riderLocation: { lat: Number, lng: Number, updatedAt: Date }, events: [{ status: String, at: Date, note: String }],
}, { timestamps: true });
export const Order = mongoose.model("Order", orderSchema);
