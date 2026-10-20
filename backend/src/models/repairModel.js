import mongoose from "mongoose";
const { Schema, model } = mongoose;

const repairSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    order: { type: Number, default: 0 },
    name: { type: String, required: true, trim: true },
    tags: [String],
    price: { type: Number, required: true, min: 0 },
    emoji: String,
    image: String,
  },
  { timestamps: true }
);


export const Repair = model("Repair", repairSchema);