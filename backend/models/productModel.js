// models/productModel.js
import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, trim: true }, // "p1", "a3" ... used in /product/:id
    section: { type: String, enum: ["popular", "accessories"], required: true, index: true },
    order: { type: Number, default: 0 },

    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    mrp: Number,
    off: Number,
    rating: Number,
    reviews: mongoose.Schema.Types.Mixed, // number or text like "2.3k"

    emoji: String,
    image: String, // a full URL, or a file name that exists in the frontend's src/assets
    images: [String],

    unit: String,
    stock: Number,
    delivery: String,
    brand: String,
    offer: { text: String, code: String, more: Number },
    replacement: String,
    warranty: String,
    specs: [{ _id: false, label: String, value: String }],
    description: String,
    highlights: [String],
    category: mongoose.Schema.Types.Mixed, // a category id, or a list of ids
  },
  { strict: false, timestamps: true } // unknown extra fields are kept, not dropped
);

export const Product = mongoose.model("Product", productSchema);
