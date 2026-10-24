// models/repairModel.js
import mongoose from "mongoose";

const repairSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, trim: true },
    order: { type: Number, default: 0 },
    name: { type: String, required: true, trim: true },
    tags: [String],
    price: { type: Number, required: true, min: 0 },
    emoji: String,
    image: String,
  },
  { strict: false, timestamps: true }
);

export const Repair = mongoose.model("Repair", repairSchema);
