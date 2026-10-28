// routes/api.js  (mounted at /api)
import { Router } from "express";
import { Product } from "../models/productModel.js";
import { Repair } from "../models/repairModel.js";
import { CategoryGroup } from "../models/categoryModel.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { deleteByUrl } from "../config/cloudinary.js";

const r = Router();

// Hide MongoDB's internal fields from API responses
const HIDE = "-_id -__v";

// every picture a product / repair uses (main image + gallery)
const imageUrls = (doc) => [doc?.image, ...(doc?.images || [])].filter(Boolean);

// --------------------------------------------------
// HOME PAGE DATA
// --------------------------------------------------

r.get("/home", async (req, res) => {
  const [products, repairs, categoryGroups] = await Promise.all([
    Product.find().sort({ order: 1 }).select(HIDE).lean(),
    Repair.find().sort({ order: 1 }).select(HIDE).lean(),
    CategoryGroup.find().sort({ order: 1 }).select(HIDE).lean(),
  ]);

  res.json({
    popular: products.filter((product) => product.section === "popular"),
    accessories: products.filter((product) => product.section === "accessories"),
    repairs,
    categoryGroups,
  });
});

// --------------------------------------------------
// CATEGORY GROUPS
// --------------------------------------------------

r.get("/categories", async (req, res) => {
  const categories = await CategoryGroup.find().sort({ order: 1 }).select(HIDE).lean();

  res.json(categories);
});

// --------------------------------------------------
// REUSABLE CRUD ROUTES
// Used by both products and repairs
// --------------------------------------------------

function crud(path, Model) {
  // GET: Fetch all records, optionally filtered by section
  r.get(path, async (req, res) => {
    const filter = {};

    if (req.query.section) {
      filter.section = req.query.section;
    }

    const records = await Model.find(filter).sort({ order: 1 }).select(HIDE).lean();

    res.json(records);
  });

  // GET: Fetch a single record by its custom ID
  r.get(`${path}/:id`, async (req, res) => {
    const record = await Model.findOne({ id: req.params.id }).select(HIDE).lean();

    if (!record) {
      return res.status(404).json({ error: "Not found" });
    }

    res.json(record);
  });

  // POST: Create a new record (new items go to the end of the list)
  r.post(path, requireAdmin, async (req, res) => {
    try {
      const body = req.body || {};
      const order = body.order ?? (await Model.countDocuments());
      const record = await Model.create({ ...body, order });

      res.status(201).json(record);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // PUT: Update an existing record
  // Pictures that were removed from the record are also deleted from Cloudinary.
  r.put(`${path}/:id`, requireAdmin, async (req, res) => {
    try {
      const before = await Model.findOne({ id: req.params.id }).lean();

      if (!before) {
        return res.status(404).json({ error: "Not found" });
      }

      const { id: _ignored, ...changes } = req.body || {}; // the id never changes

      const record = await Model.findOneAndUpdate({ id: req.params.id }, changes, {
        new: true,
        runValidators: true,
      });

      const keep = new Set(imageUrls(record));
      await Promise.all(imageUrls(before).filter((url) => !keep.has(url)).map(deleteByUrl));

      res.json(record);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // DELETE: Remove an existing record (and its Cloudinary pictures)
  r.delete(`${path}/:id`, requireAdmin, async (req, res) => {
    const record = await Model.findOneAndDelete({ id: req.params.id });

    if (!record) {
      return res.status(404).json({ error: "Not found" });
    }

    await Promise.all(imageUrls(record).map(deleteByUrl));

    res.json({ ok: true });
  });
}

// --------------------------------------------------
// REGISTER CRUD ROUTES
// --------------------------------------------------

crud("/products", Product);
crud("/repairs", Repair);











/**
 * CATEGORY GROUP MANAGEMENT
 * Uses the existing CategoryGroup model.
 * Mounted under /api.
 */

// Create a category group
r.post("/categories", requireAdmin, async (req, res) => {
  try {
    const { id, title, items = [], order = 0 } = req.body || {};

    if (!id?.trim() || !title?.trim()) {
      return res.status(400).json({
        error: "Category group ID and title are required",
      });
    }

    if (!Array.isArray(items)) {
      return res.status(400).json({
        error: "Category items must be an array",
      });
    }

    const record = await CategoryGroup.create({
      id: id.trim(),
      title: title.trim(),
      order: Number(order) || 0,
      items: items.map((item) => ({
        id: String(item.id || "").trim(),
        name: String(item.name || "").trim(),
        emoji: String(item.emoji || ""),
        image: String(item.image || ""),
      })),
    });

    res.status(201).json(record);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update a category group; its ID stays unchanged
r.put("/categories/:id", requireAdmin, async (req, res) => {
  try {
    const { title, items, order } = req.body || {};
    const changes = {};

    if (title !== undefined) changes.title = String(title).trim();
    if (items !== undefined) {
      if (!Array.isArray(items)) {
        return res.status(400).json({
          error: "Category items must be an array",
        });
      }

      changes.items = items.map((item) => ({
        id: String(item.id || "").trim(),
        name: String(item.name || "").trim(),
        emoji: String(item.emoji || ""),
        image: String(item.image || ""),
      }));
    }
    if (order !== undefined) changes.order = Number(order) || 0;

    const record = await CategoryGroup.findOneAndUpdate(
      { id: req.params.id },
      changes,
      { new: true, runValidators: true }
    );

    if (!record) {
      return res.status(404).json({ error: "Category group not found" });
    }

    res.json(record);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a category group
r.delete("/categories/:id", requireAdmin, async (req, res) => {
  try {
    const record = await CategoryGroup.findOneAndDelete({
      id: req.params.id,
    });

    if (!record) {
      return res.status(404).json({ error: "Category group not found" });
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// Export the router
export default r;