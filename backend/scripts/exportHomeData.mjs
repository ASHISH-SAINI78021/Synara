// scripts/exportHomeData.mjs
// Copies the products, repairs and categories from your frontend homeData.js into seed/data.json
//   npm run export -- ../frontend/src/data/homeData.js
import { register } from "node:module";
import { pathToFileURL, fileURLToPath } from "node:url";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

register("./imageLoader.mjs", import.meta.url);

const src = process.argv[2];
if (!src) {
  console.error("Tell me where homeData.js is, for example:\n  npm run export -- ../frontend/src/data/homeData.js");
  process.exit(1);
}

const data = await import(pathToFileURL(path.resolve(src)).href);
const tag = (list, section) => (list || []).map((p, i) => ({ ...p, section, order: i }));

const out = {
  products: [...tag(data.popular, "popular"), ...tag(data.accessories, "accessories")],
  repairs: (data.repairs || []).map((r, i) => ({ ...r, order: i })),
  categoryGroups: (data.categoryGroups || []).map((g, i) => ({ ...g, order: i })),
};

const file = path.join(path.dirname(fileURLToPath(import.meta.url)), "../seed/data.json");
mkdirSync(path.dirname(file), { recursive: true });
writeFileSync(file, JSON.stringify(out, null, 2));
console.log(`Saved ${out.products.length} products, ${out.repairs.length} repairs, ${out.categoryGroups.length} category groups to seed/data.json`);
