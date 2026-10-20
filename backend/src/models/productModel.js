import mongoose from "mongoose";
const { Schema, model } = mongoose;

const productSchema = new Schema(
  {
    id: { type: String, required: true, unique: true }, // "p1", "a3" ... used in URLs and the cart
    section: { type: String, enum: ["popular", "accessories"], required: true },
    order: { type: Number, default: 0 },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    mrp: Number,
    off: Number,
    rating: Number,
    reviews: Number,
    emoji: String,
    image: String,
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
    category: String,
  },
  { timestamps: true }
);


export const Product = model("Product", productSchema);