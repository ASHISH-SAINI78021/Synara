// src/utils/resolveImage.js
// The database can't store imported images, so it stores either
//   1) a full URL  (https://...)            -> used as it is
//   2) a file name that exists in src/assets (e.g. "headphones.png") -> looked up here
const files = import.meta.glob("../assets/**/*.{png,jpg,jpeg,webp,avif,svg,gif}", {
  eager: true,
  query: "?url",
  import: "default",
});

const byName = {};
for (const [path, url] of Object.entries(files)) {
  byName[path.split("/").pop().toLowerCase()] = url;
}

export function resolveImage(value) {
  if (!value || typeof value !== "string") return value ?? null;
  if (/^(https?:)?\/\//i.test(value) || value.startsWith("data:")) return value;
  const name = value.split("/").pop().toLowerCase();
  if (byName[name]) return byName[name];
  // a path that starts with "/" is a file in /public (or an already-built URL): keep it.
  // A bare file name we can't find in src/assets would be a broken image, so use null (shows the emoji).
  return value.startsWith("/") ? value : null;
}
