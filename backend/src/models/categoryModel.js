import mongoose from "mongoose";
const { Schema, model } = mongoose;

const categoryGroupSchema = new Schema({
  id: { type: String, required: true, unique: true },
  order: { type: Number, default: 0 },
  title: { type: String, required: true },
  items: [{ _id: false, id: String, name: String, emoji: String, image: String }],
});


export const CategoryGroup = model("CategoryGroup", categoryGroupSchema);