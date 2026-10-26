import crypto from "node:crypto";
import { User } from "../models/userModel.js";

const b64 = (value) => Buffer.from(value).toString("base64url");
export function signToken(user) {
  const secret = process.env.AUTH_TOKEN_SECRET;
  if (!secret || secret.length < 32) throw new Error("AUTH_TOKEN_SECRET must be set to a random secret of at least 32 characters");
  const now = Math.floor(Date.now() / 1000);
  const head = b64(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = b64(JSON.stringify({ sub: String(user._id), role: user.role, iat: now, exp: now + 60 * 60 * 24 * 7 }));
  const unsigned = `${head}.${body}`;
  return `${unsigned}.${crypto.createHmac("sha256", secret).update(unsigned).digest("base64url")}`;
}
function decodeToken(token) {
  const secret = process.env.AUTH_TOKEN_SECRET;
  if (!secret || secret.length < 32) throw new Error("Authentication is not configured");
  const parts = String(token || "").split(".");
  if (parts.length !== 3) throw new Error("Invalid token");
  const expected = crypto.createHmac("sha256", secret).update(`${parts[0]}.${parts[1]}`).digest();
  const actual = Buffer.from(parts[2], "base64url");
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) throw new Error("Invalid token");
  const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  if (!payload.sub || !payload.exp || payload.exp < Date.now() / 1000) throw new Error("Expired token");
  return payload;
}
export async function requireAuth(req, res, next) {
  try {
    const token = req.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) return res.status(401).json({ error: "Sign in to continue" });
    const payload = decodeToken(token);
    const user = await User.findById(payload.sub).select("name phone email phoneVerified role active");
    if (!user || !user.active || user.role !== payload.role) return res.status(401).json({ error: "Account unavailable" });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: err.message === "Authentication is not configured" ? err.message : "Invalid or expired session" });
  }
}
export function requireRole(...roles) {
  return (req, res, next) => roles.includes(req.user?.role) ? next() : res.status(403).json({ error: "Insufficient permissions" });
}
export function hashSecret(value) { return crypto.createHash("sha256").update(String(value)).digest("hex"); }
