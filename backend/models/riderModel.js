import mongoose from "mongoose";
const riderSchema = new mongoose.Schema({
  riderId: { type: String, required: true, unique: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  name: { type: String, required: true, trim: true }, phone: { type: String, required: true, match: /^\d{10}$/ },
  vehicleType: { type: String, required: true, enum: ["motorcycle", "scooter", "bicycle", "other"] },
  vehicleOther: { type: String, default: "" }, vehicleRegistration: { type: String, required: true, trim: true, uppercase: true },
  serviceZones: { type: [String], default: [] },
  documents: {
    drivingLicence: { publicId: { type: String, required: true }, resourceType: { type: String, enum: ["image", "raw"], required: true }, format: String },
    governmentId: { publicId: { type: String, required: true }, resourceType: { type: String, enum: ["image", "raw"], required: true }, format: String },
    vehicleRegistration: { publicId: { type: String, required: true }, resourceType: { type: String, enum: ["image", "raw"], required: true }, format: String },
    profilePhoto: { publicId: String, resourceType: { type: String, enum: ["image", "raw"] }, format: String },
  },
  status: { type: String, enum: ["pending", "approved", "rejected", "suspended"], default: "pending", index: true },
  adminNote: { type: String, default: "" }, approvedAt: Date, approvedBy: String,
  online: { type: Boolean, default: false }, location: { lat: Number, lng: Number, updatedAt: Date },
  payoutMode: { type: String, enum: ["fixed", "distance"], default: "fixed" }, fixedPayout: { type: Number, min: 0, default: 40 }, payoutPerKm: { type: Number, min: 0, default: 8 },
  completedDeliveries: { type: Number, default: 0 }, totalEarnings: { type: Number, default: 0 },
}, { timestamps: true });
export const Rider = mongoose.model("Rider", riderSchema);
