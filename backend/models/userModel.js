import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  phone: { type: String, required: true, unique: true, match: /^\d{10}$/ },
  email: { type: String, trim: true, lowercase: true, sparse: true, unique: true },
  passwordHash: { type: String, required: true, select: false },
  phoneVerified: { type: Boolean, default: false },
  role: { type: String, enum: ["customer", "rider"], default: "customer" },
  active: { type: Boolean, default: true },
}, { timestamps: true });

export const User = mongoose.model("User", userSchema);
