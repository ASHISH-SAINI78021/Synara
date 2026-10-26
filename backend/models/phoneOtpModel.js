import mongoose from "mongoose";
const phoneOtpSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  codeHash: { type: String, required: true },
  expiresAt: { type: Date, required: true, expires: 0 },
  attempts: { type: Number, default: 0 },
}, { timestamps: true });
export const PhoneOtp = mongoose.model("PhoneOtp", phoneOtpSchema);