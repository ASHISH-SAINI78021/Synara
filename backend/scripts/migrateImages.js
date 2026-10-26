// scripts/migrateImages.js  ->  npm run migrate-images
// ONE TIME: your pictures are saved as plain file names (like "headphones.png").
// This uploads each one from ../frontend/src/assets to Cloudinary and saves the
// Cloudinary link in MongoDB instead. Pictures that are already links are skipped.
//
// Run it only AFTER you have tested one upload from the admin page and seen the
// picture show on the shop. Running "npm run seed" later brings the file names back.
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { Product } from "../models/productModel.js";
import { Repair } from "../models/repairModel.js";
import { CategoryGroup } from "../models/categoryModel.js";
import { uploadFile } from "../config/cloudinary.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.resolve(here, "../../frontend/src/assets");

const done = new Map(); // file name -> Cloudinary link (each picture is uploaded only once)
const missing = new Set(); // file names that were not found in src/assets

// "headphones.png" yes, "https://..." no
const isFileName = (v) => typeof v === "string" && /^[\w.\- ]+\.(png|jpe?g|webp|avif|gif|svg)$/i.test(v);

async function toCloud(value) {
  if (!isFileName(value)) return value;
  if (done.has(value)) return done.get(value);

  const file = path.join(assetsDir, value);
  if (!fs.existsSync(file)) {
    missing.add(value);
    return value; // keep the file name, nothing is lost
  }

  const result = await uploadFile(file);
  done.set(value, result.secure_url);
  console.log("uploaded", value);
  return result.secure_url;
}

try {
  await connectDB();

  for (const doc of [...(await Product.find()), ...(await Repair.find())]) {
    doc.image = await toCloud(doc.image);
    if (doc.images?.length) doc.images = await Promise.all(doc.images.map(toCloud));
    await doc.save();
  }

  for (const group of await CategoryGroup.find()) {
    group.items = await Promise.all(
      group.items.map(async (item) => ({
        id: item.id,
        name: item.name,
        emoji: item.emoji,
        image: await toCloud(item.image),
      }))
    );
    await group.save();
  }

  console.log(`Done. ${done.size} pictures are now on Cloudinary.`);
  if (missing.size) {
    console.warn(`Not found in ${assetsDir} (left as they were):\n  ${[...missing].join("\n  ")}`);
  }
} catch (err) {
  console.error("Migration failed:", err.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}