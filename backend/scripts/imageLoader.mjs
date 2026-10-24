// scripts/imageLoader.mjs
// Lets Node read your frontend's homeData.js: every image import becomes just its file name.
export async function load(url, context, nextLoad) {
  if (/\.(png|jpe?g|webp|avif|gif|svg)(\?.*)?$/i.test(url)) {
    const name = decodeURIComponent(new URL(url).pathname.split("/").pop());
    return { format: "module", source: `export default ${JSON.stringify(name)};`, shortCircuit: true };
  }
  return nextLoad(url, context);
}
