import { Router } from "express";
import crypto from "node:crypto";
import { promisify } from "node:util";
import { User } from "../models/userModel.js";
import { PhoneOtp } from "../models/phoneOtpModel.js";
import { requireAuth, signToken, hashSecret } from "../middleware/requireAuth.js";
import { sendOtpEmail, maskEmail } from "../services/email.js";
import { rateLimit } from "../middleware/rateLimit.js";
const r = Router();
const scrypt = promisify(crypto.scrypt);
const cleanEmail = (v) => typeof v === "string" ? v.trim().toLowerCase().slice(0, 200) : "";
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const cleanPhone = (v) => typeof v === "string" ? v.replace(/\D/g, "").slice(-10) : "";
async function passwordHash(password, salt = crypto.randomBytes(16).toString("hex")) {
  const key = await scrypt(password, salt, 64);
  return `${salt}:${key.toString("hex")}`;
}
async function passwordMatches(password, encoded) {
  const [salt, key] = String(encoded || "").split(":");
  if (!salt || !key) return false;
  const actual = await scrypt(password, salt, 64);
  const expected = Buffer.from(key, "hex");
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}
r.post("/otp/send", rateLimit({ max: 10 }), async (req, res) => {
  const email = cleanEmail(req.body?.email);
  if (!isEmail(email)) return res.status(400).json({ error: "Enter the email address you registered with" });
  try {
    const user = await User.findOne({ email }).select("name email phone active");
    if (!user || !user.active) return res.status(404).json({ error: "No account found for this email. Create an account first." });

    // the OTP record is filed under the account's phone number (keeps the existing database layout unchanged)
    const recent = await PhoneOtp.findOne({ phone: user.phone });
    if (recent && Date.now() - recent.updatedAt.getTime() < 60_000) return res.status(429).json({ error: "Please wait a minute before requesting another code" });

    const code = String(crypto.randomInt(100000, 1000000));
    await sendOtpEmail({ to: user.email, name: user.name, code });
    await PhoneOtp.findOneAndUpdate({ phone: user.phone }, { phone: user.phone, codeHash: hashSecret(code), expiresAt: new Date(Date.now() + 5 * 60_000), attempts: 0 }, { upsert: true, new: true, setDefaultsOnInsert: true });
    res.json({ ok: true, message: `Verification code sent to ${maskEmail(user.email)}. It expires in 5 minutes.` });
  } catch (err) { console.error("[otp/send] failed for", email, "-", err.detail || err.message); res.status(err.status || 502).json({ error: err.publicMessage || "We could not send the code right now. Please try again." }); }
});
r.post("/otp/verify", async (req, res) => {
  const email = cleanEmail(req.body?.email), code = String(req.body?.code || "").trim();
  const user = isEmail(email) ? await User.findOne({ email }).select("phone") : null;
  const otp = user ? await PhoneOtp.findOne({ phone: user.phone }) : null;
  if (!otp || otp.expiresAt < new Date() || otp.attempts >= 5) return res.status(400).json({ error: "Code expired or not found. Request a new code." });
  if (otp.codeHash !== hashSecret(code)) { otp.attempts += 1; await otp.save(); return res.status(400).json({ error: "Incorrect verification code" }); }
  await PhoneOtp.deleteOne({ phone: user.phone });
  await User.updateOne({ _id: user._id }, { phoneVerified: true });
  res.json({ ok: true, verified: true });
});
r.post("/register", rateLimit({ max: 5, message: "Too many registration attempts. Please try again later." }), async (req, res) => {
  if (!process.env.AUTH_TOKEN_SECRET || process.env.AUTH_TOKEN_SECRET.length < 32) return res.status(503).json({ error: "Authentication is not configured. Set AUTH_TOKEN_SECRET (32+ characters) in backend/.env and restart." });
  const name = String(req.body?.name || "").trim().slice(0, 100), phone = cleanPhone(req.body?.phone);
  const email = String(req.body?.email || "").trim().toLowerCase().slice(0, 200), password = String(req.body?.password || "");
  if (name.length < 2 || !/^\d{10}$/.test(phone) || password.length < 10 || password.length > 128 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Enter your name, a valid mobile number, a valid email (we send your verification code there), and a password between 10 and 128 characters" });
  try {
    const verified = await User.findOne({ phone, phoneVerified: true });
    if (verified) return res.status(409).json({ error: "This phone number already has an account" });
    const exists = await User.findOne({ $or: [{ phone }, ...(email ? [{ email }] : [])] });
    if (exists) return res.status(409).json({ error: "Phone number or email is already registered" });
    const user = await User.create({ name, phone, ...(email ? { email } : {}), passwordHash: await passwordHash(password), phoneVerified: false, role: "customer" });
    res.status(201).json({ user: { id: user.id, name: user.name, phone: user.phone, email: user.email, phoneVerified: user.phoneVerified }, token: signToken(user), message: "Account created. Verify your phone before applying as a rider." });
  } catch (err) { res.status(err.code === 11000 ? 409 : 400).json({ error: err.code === 11000 ? "Account already exists" : "Could not create account. Check your details and try again." }); }
});
r.post("/login", rateLimit({ max: 10, message: "Too many login attempts. Please try again in a few minutes." }), async (req, res) => {
  if (!process.env.AUTH_TOKEN_SECRET || process.env.AUTH_TOKEN_SECRET.length < 32) return res.status(503).json({ error: "Authentication is not configured. Set AUTH_TOKEN_SECRET (32+ characters) in backend/.env and restart." });
  const email = cleanEmail(req.body?.email), phone = cleanPhone(req.body?.phone), password = String(req.body?.password || "");
  const who = isEmail(email) ? { email } : /^\d{10}$/.test(phone) ? { phone } : null; // email is the normal way; phone still works for older accounts
  if (!who) return res.status(401).json({ error: "Invalid email or password" });
  const user = await User.findOne(who).select("+passwordHash name phone email phoneVerified role active");
  if (!user || !user.active || !(await passwordMatches(password, user.passwordHash))) return res.status(401).json({ error: "Invalid email or password" });
  res.json({ user: { id: user.id, name: user.name, phone: user.phone, email: user.email, phoneVerified: user.phoneVerified, role: user.role }, token: signToken(user) });
});
r.get("/me", requireAuth, (req, res) => res.json({ user: req.user }));
export default r;
