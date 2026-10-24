// middleware/requireAdmin.js
// Temporary guard for owner-only routes (real login comes later).
// Send the header:  x-admin-key: <ADMIN_KEY from .env>
export function requireAdmin(req, res, next) {
  const key = process.env.ADMIN_KEY;
  if (!key || req.get("x-admin-key") !== key) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}
