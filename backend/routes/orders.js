import { Router } from "express";
import crypto from "node:crypto";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { Product } from "../models/productModel.js";
import { Order } from "../models/orderModel.js";
import { Rider } from "../models/riderModel.js";
const r = Router();
const s = (v, max = 500) => typeof v === "string" ? v.trim().slice(0, max) : "";
const HIDE = "-deliveryOtpHash -__v";
const newId = () => `SYN-O-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
const otpHash = (otp) => crypto.createHash("sha256").update(`${otp}:${process.env.AUTH_TOKEN_SECRET}`).digest("hex");

// Create a COD order. Prices are always resolved from MongoDB, never trusted from the browser.
r.post("/", requireAuth, async (req, res) => {
  const rawItems = Array.isArray(req.body?.items) ? req.body.items.slice(0, 30) : [];
  const address = s(req.body?.address, 500), zone = s(req.body?.zone, 80);
  const rawLocation = req.body?.location;
  const destination = rawLocation && Number.isFinite(Number(rawLocation.lat)) && Number.isFinite(Number(rawLocation.lng)) && Math.abs(Number(rawLocation.lat)) <= 90 && Math.abs(Number(rawLocation.lng)) <= 180 ? { lat: Number(rawLocation.lat), lng: Number(rawLocation.lng) } : undefined;
  if (!rawItems.length || !address) return res.status(400).json({ error: "Cart items and delivery address are required" });
  if (req.body?.paymentMethod && req.body.paymentMethod !== "cod") return res.status(400).json({ error: "Online payments are not configured yet. Choose cash on delivery." });
  const merged = new Map();
  for (const item of rawItems) {
    const id = s(item?.id, 80), qty = Number(item?.qty);
    if (!id || !Number.isInteger(qty) || qty < 1 || qty > 10) return res.status(400).json({ error: "Each item needs a valid product ID and quantity from 1 to 10" });
    merged.set(id, (merged.get(id) || 0) + qty);
  }
  if ([...merged.values()].some(q => q > 10)) return res.status(400).json({ error: "Maximum quantity per product is 10" });
  try {
    const products = await Product.find({ id: { $in: [...merged.keys()] } }).select("id name image price stock").lean();
    const byId = new Map(products.map(p => [p.id, p]));
    if (byId.size !== merged.size) return res.status(400).json({ error: "One or more cart products are no longer available" });
    const items = [];
    for (const [id, quantity] of merged) {
      const p = byId.get(id);
      if (typeof p.stock === "number" && p.stock < quantity) return res.status(409).json({ error: `${p.name} does not have enough stock` });
      items.push({ productId: p.id, name: p.name, image: p.image, unitPrice: p.price, quantity });
    }
    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const deliveryFee = subtotal >= 499 ? 0 : 30;
    const deliveryOtp = String(crypto.randomInt(100000, 1000000));
    const order = await Order.create({ orderId: newId(), customer: req.user._id, customerName: req.user.name, customerPhone: req.user.phone, items, address, zone, ...(destination ? { destination } : {}), subtotal, deliveryFee, total: subtotal + deliveryFee, paymentMethod: "cod", deliveryOtpHash: otpHash(deliveryOtp), events: [{ status: "open", at: new Date(), note: "Order placed" }] });
    // Reserve stock only for catalog records that track it. If any reservation fails, roll back this order's earlier reservations.
    const reserved = [];
    try {
      for (const item of items) {
        const p = byId.get(item.productId);
        if (typeof p.stock !== "number") continue;
        const updated = await Product.findOneAndUpdate({ id: item.productId, stock: { $gte: item.quantity } }, { $inc: { stock: -item.quantity } }, { new: true });
        if (!updated) throw new Error(`${p.name} just went out of stock`);
        reserved.push(item);
      }
    } catch (stockErr) {
      await Promise.all(reserved.map(item => Product.updateOne({ id: item.productId }, { $inc: { stock: item.quantity } })));
      await Order.deleteOne({ _id: order._id });
      return res.status(409).json({ error: stockErr.message });
    }
    const orderResponse = order.toObject(); delete orderResponse.deliveryOtpHash;
    res.status(201).json({ order: orderResponse, deliveryOtp, message: "Order placed. Keep the delivery OTP private until the rider arrives." });
  } catch (err) { console.error("Create order failed", err); res.status(500).json({ error: "Could not create order" }); }
});
r.get("/mine", requireAuth, async (req, res) => {
  const orders = await Order.find({ customer: req.user._id }).sort({ createdAt: -1 }).select(HIDE).lean();
  // Recover thumbnails for older order snapshots from the current product catalogue.
  const missingIds = [...new Set(orders.flatMap(order =>
    (order.items || []).filter(item => !item.image).map(item => item.productId)
  ))];
  let catalogById = new Map();
  if (missingIds.length) {
    const products = await Product.find({ id: { $in: missingIds } }).select("id image images").lean();
    catalogById = new Map(products.map(product => [product.id, product]));
  }
  const enriched = orders.map(order => ({
    ...order,
    items: (order.items || []).map(item => {
      if (item.image) return item;
      const product = catalogById.get(item.productId);
      return { ...item, image: product?.image || product?.images?.[0] || null };
    }),
  }));
  res.json(enriched);
});
r.get("/:orderId", requireAuth, async (req, res) => {
  const order = await Order.findOne({ orderId: req.params.orderId, customer: req.user._id }).select(HIDE).lean();
  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json(order);
});
r.post("/:orderId/delivery-otp", requireAuth, async (req, res) => {
  const order = await Order.findOne({ orderId: req.params.orderId, customer: req.user._id, status: { $in: ["open", "assigned", "picked_up", "out_for_delivery"] } });
  if (!order) return res.status(404).json({ error: "Order not found or delivery is already complete" });
  const deliveryOtp = String(crypto.randomInt(100000, 1000000));
  order.deliveryOtpHash = otpHash(deliveryOtp);
  await order.save();
  res.json({ deliveryOtp, message: "Delivery OTP refreshed. Share it only with the assigned rider at delivery." });
});
r.post("/:orderId/cancel", requireAuth, async (req, res) => {
  const order = await Order.findOneAndUpdate({ orderId: req.params.orderId, customer: req.user._id, status: "open" }, { $set: { status: "cancelled" }, $push: { events: { status: "cancelled", at: new Date(), note: "Cancelled by customer" } } }, { new: true }).select(HIDE);
  if (!order) return res.status(409).json({ error: "Order cannot be cancelled after a rider accepts it" });
  // Restore stock for stock-tracked products.
  await Promise.all(order.items.map(item => Product.updateOne({ id: item.productId, stock: { $exists: true } }, { $inc: { stock: item.quantity } })));
  res.json(order);
});
// Admin order list and manual assignment use the existing admin key.
r.get("/admin/all", requireAdmin, async (req, res) => {
  const status = s(req.query.status, 30);
  const filter = status ? { status } : {};
  const [orders, riders] = await Promise.all([Order.find(filter).sort({ createdAt: -1 }).select(HIDE).limit(300).lean(), Rider.find({ status: "approved" }).select("riderId name phone vehicleType serviceZones").lean()]);
  res.json({ orders, riders });
});
r.patch("/admin/:orderId/assign", requireAdmin, async (req, res) => {
  const rider = await Rider.findOne({ riderId: s(req.body?.riderId, 30), status: "approved" });
  if (!rider) return res.status(400).json({ error: "Select an approved rider" });
  const distanceKm = Number(req.body?.distanceKm);
  const distanceUpdate = Number.isFinite(distanceKm) && distanceKm >= 0 && distanceKm <= 500 ? { distanceKm } : {};
  const order = await Order.findOneAndUpdate({ orderId: req.params.orderId, status: { $in: ["open", "assigned"] } }, { $set: { rider: rider._id, riderId: rider.riderId, status: "assigned", assignedAt: new Date(), ...distanceUpdate }, $push: { events: { status: "assigned", at: new Date(), note: "Assigned by admin" } } }, { new: true }).select(HIDE);
  if (!order) return res.status(409).json({ error: "Order is not assignable" });
  res.json(order);
});
export default r;
