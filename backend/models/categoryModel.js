// models/categoryModel.js
import mongoose from "mongoose";

const categoryGroupSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, trim: true },
    order: { type: Number, default: 0 },
    title: { type: String, required: true, trim: true },
    items: [{ _id: false, id: String, name: String, emoji: String, image: String }],
  },
  { strict: false, timestamps: true }
);

export const CategoryGroup = mongoose.model("CategoryGroup", categoryGroupSchema);
