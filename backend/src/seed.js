// backend/src/seed.js
// Copies the data in frontend/src/data/homeData.js into MongoDB.
// WARNING: it deletes and re-creates products, repairs and categories every time it runs.
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import mongoose from "mongoose";
import { Product, Repair, CategoryGroup } from "./models.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const source = path.resolve(here, "../../frontend/src/data/homeData.js");
const temp = path.join(here, ".homeData.tmp.mjs");

// import x from "../assets/y.png"  ->  const x = "/products/y.png"
const text = fs
  .readFileSync(source, "utf8")
  .replace(
    /import\s+(\w+)\s+from\s+["']\.\.\/assets\/([^"']+)["'];?/g,
    (_, name, file) => `const ${name} = "/products/${file}";`
  );

fs.writeFileSync(temp, text);

try {
  const { popular, accessories, repairs, categoryGroups } = await import(pathToFileURL(temp).href);

  const products = [
    ...popular.map((p, i) => ({ ...p, section: "popular", order: i })),
    ...accessories.map((p, i) => ({ ...p, section: "accessories", order: i })),
  ];

  await mongoose.connect(process.env.MONGODB_URI);
  await Promise.all([Product.deleteMany({}), Repair.deleteMany({}), CategoryGroup.deleteMany({})]);
  await Product.insertMany(products);
  await Repair.insertMany(repairs.map((r, i) => ({ ...r, order: i })));
  await CategoryGroup.insertMany(categoryGroups.map((g, i) => ({ ...g, order: i })));

  console.log(
    `Seeded ${products.length} products, ${repairs.length} repairs, ${categoryGroups.length} category groups`
  );
} finally {
  fs.unlinkSync(temp);
  await mongoose.disconnect();
}