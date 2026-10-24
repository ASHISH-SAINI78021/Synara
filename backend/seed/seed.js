// seed/seed.js  ->  npm run seed
// WARNING: deletes the products, repairs and categories in the database, then re-adds them from seed/data.json
import "dotenv/config";
import fs from "node:fs";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { Product } from "../models/productModel.js";
import { Repair } from "../models/repairModel.js";
import { CategoryGroup } from "../models/categoryModel.js";

const file = new URL("./data.json", import.meta.url);
if (!fs.existsSync(file)) {
  console.error("seed/data.json not found. First run:\n  npm run export -- ../frontend/src/data/homeData.js");
  process.exit(1);
}
const data = JSON.parse(fs.readFileSync(file, "utf8"));

await connectDB();
await Promise.all([Product.deleteMany({}), Repair.deleteMany({}), CategoryGroup.deleteMany({})]);
await Product.insertMany(data.products);
await Repair.insertMany(data.repairs);
await CategoryGroup.insertMany(data.categoryGroups);

console.log(`Done: ${data.products.length} products, ${data.repairs.length} repairs, ${data.categoryGroups.length} category groups`);
await mongoose.disconnect();
