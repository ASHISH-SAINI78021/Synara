import { Router } from "express";
import { Product } from "../models/productModel.js";
import { Repair } from "../models/repairModel.js";
import { CategoryGroup } from "../models/categoryModel.js";

const r = Router();

// Hide MongoDB's internal fields from API responses
const HIDE = "-_id -__v";

// Temporary guard for write routes (real login comes later)
function requireAdmin(req, res, next) {
  const key = process.env.ADMIN_KEY;
  const providedKey = req.get("x-admin-key");

  if (!key || providedKey !== key) {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }

  next();
}

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
    accessories: products.filter(
      (product) => product.section === "accessories"
    ),
    repairs,
    categoryGroups,
  });
});

// --------------------------------------------------
// CATEGORY GROUPS
// --------------------------------------------------

r.get("/categories", async (req, res) => {
  const categories = await CategoryGroup.find()
    .sort({ order: 1 })
    .select(HIDE)
    .lean();

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

    const records = await Model.find(filter)
      .sort({ order: 1 })
      .select(HIDE)
      .lean();

    res.json(records);
  });

  // GET: Fetch a single record by its custom ID
  r.get(`${path}/:id`, async (req, res) => {
    const record = await Model.findOne({
      id: req.params.id,
    })
      .select(HIDE)
      .lean();

    if (!record) {
      return res.status(404).json({
        error: "Not found",
      });
    }

    res.json(record);
  });

  // POST: Create a new record
  r.post(path, requireAdmin, async (req, res) => {
    try {
      const record = await Model.create(req.body);

      res.status(201).json(record);
    } catch (err) {
      res.status(400).json({
        error: err.message,
      });
    }
  });

  // PUT: Update an existing record
  r.put(`${path}/:id`, requireAdmin, async (req, res) => {
    try {
      const record = await Model.findOneAndUpdate(
        { id: req.params.id },
        req.body,
        {
          new: true,
          runValidators: true,
        }
      );

      if (!record) {
        return res.status(404).json({
          error: "Not found",
        });
      }

      res.json(record);
    } catch (err) {
      res.status(400).json({
        error: err.message,
      });
    }
  });

  // DELETE: Remove an existing record
  r.delete(`${path}/:id`, requireAdmin, async (req, res) => {
    const record = await Model.findOneAndDelete({
      id: req.params.id,
    });

    if (!record) {
      return res.status(404).json({
        error: "Not found",
      });
    }

    res.json({
      ok: true,
    });
  });
}

// --------------------------------------------------
// REGISTER CRUD ROUTES
// --------------------------------------------------

crud("/products", Product);
crud("/repairs", Repair);

// Export the router
export default r;
