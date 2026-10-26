// config/cloudinary.js
// Talks to Cloudinary: upload a picture, delete a picture.
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// every upload is resized to fit inside 1200x1200 and compressed
// (transparent PNGs stay transparent)
const OPTIONS = {
  resource_type: "image",
  transformation: [{ width: 1200, height: 1200, crop: "limit" }, { quality: "auto" }],
};

function assertConfigured() {
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    throw new Error("Cloudinary is not set up. Fill the CLOUDINARY_* values in .env and restart the server.");
  }
}

// upload a picture that is in memory (from the admin page)
export function uploadBuffer(buffer, folder = "synara/products") {
  assertConfigured();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ ...OPTIONS, folder }, (err, result) =>
      err ? reject(err) : resolve(result)
    );
    stream.end(buffer);
  });
}


// Rider verification documents are stored privately in a dedicated folder.
export function uploadDocumentBuffer(buffer, mimetype) {
  assertConfigured();
  return new Promise((resolve, reject) => {
    const resourceType = mimetype === "application/pdf" ? "raw" : "image";
    const stream = cloudinary.uploader.upload_stream({ resource_type: resourceType, type: "authenticated", access_mode: "authenticated", folder: "synara/rider-documents", unique_filename: true, use_filename: false }, (err, result) =>
      err ? reject(err) : resolve(result)
    );
    stream.end(buffer);
  });
}

// upload a picture from the disk (used by scripts/migrateImages.js)
export function uploadFile(filePath, folder = "synara/products") {
  assertConfigured();
  return cloudinary.uploader.upload(filePath, {
    ...OPTIONS,
    folder,
    use_filename: true,
    unique_filename: true,
  });
}

// only pictures that live in OUR Cloudinary account may be deleted
function isOurs(url) {
  return (
    typeof url === "string" &&
    !!process.env.CLOUDINARY_CLOUD_NAME &&
    url.startsWith(`https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/`)
  );
}

// deleteByUrl("https://res.cloudinary.com/xxx/image/upload/v123/synara/products/abc.png")
// Plain file names like "headphones.png" are ignored (nothing to delete online).
export async function deleteByUrl(url) {
  if (!isOurs(url)) return;
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[^./]+$/);
  if (!match) return;
  try {
    await cloudinary.uploader.destroy(match[1], { resource_type: "image", invalidate: true });
  } catch (err) {
    console.warn("Cloudinary delete failed:", err.message);
  }
}
// Short-lived signed download URL for an authenticated rider document.
export function getPrivateDocumentUrl(publicId, format, resourceType = "image") {
  assertConfigured();
  return cloudinary.utils.private_download_url(publicId, format || (resourceType === "raw" ? "pdf" : "jpg"), {
    resource_type: resourceType, type: "authenticated", expires_at: Math.floor(Date.now() / 1000) + 300,
  });
}
