// routes/uploads.js  (mounted at /api/uploads)
import { Router } from "express";
import multer from "multer";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { uploadBuffer } from "../config/cloudinary.js";

const r = Router();

// pictures are kept in memory just long enough to send them to Cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 8 }, // 8 MB each, up to 8 at a time
  fileFilter: (req, file, cb) =>
    file.mimetype.startsWith("image/") ? cb(null, true) : cb(new Error("Only image files are allowed")),
});

// OWNER ONLY: POST /api/uploads   (form field name: "images")
// answers: { images: [{ url, publicId, width, height }] }
r.post("/", requireAdmin, (req, res) => {
  upload.array("images", 8)(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.files?.length) return res.status(400).json({ error: "No images received" });

    try {
      const results = await Promise.all(req.files.map((f) => uploadBuffer(f.buffer)));
      res.status(201).json({
        images: results.map((x) => ({
          url: x.secure_url,
          publicId: x.public_id,
          width: x.width,
          height: x.height,
        })),
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: e.message || "Image upload failed" });
    }
  });
});

export default r;