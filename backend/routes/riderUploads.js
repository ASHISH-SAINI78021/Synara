import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../middleware/requireAuth.js";
import { uploadDocumentBuffer } from "../config/cloudinary.js";
import { RiderDocument } from "../models/riderDocumentModel.js";
const r = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024, files: 1 }, fileFilter: (_req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  cb(allowed.includes(file.mimetype) ? null : new Error("Upload a JPG, PNG, WEBP or PDF document"), allowed.includes(file.mimetype));
} });
r.post("/", requireAuth, (req, res) => upload.single("document")(req, res, async (err) => {
  if (err) return res.status(400).json({ error: err.message });
  if (!req.file) return res.status(400).json({ error: "Choose a document to upload" });
  try {
    const result = await uploadDocumentBuffer(req.file.buffer, req.file.mimetype);
    await RiderDocument.create({ user: req.user._id, publicId: result.public_id, resourceType: result.resource_type, format: result.format });
    res.status(201).json({ publicId: result.public_id, resourceType: result.resource_type, format: result.format });
  } catch (e) { res.status(503).json({ error: e.message || "Document upload failed" }); }
}));
export default r;
