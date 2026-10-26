import mongoose from "mongoose";
const riderDocumentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  publicId: { type: String, required: true, unique: true },
  resourceType: { type: String, enum: ["image", "raw"], required: true },
  format: String,
}, { timestamps: true });
export const RiderDocument = mongoose.model("RiderDocument", riderDocumentSchema);
