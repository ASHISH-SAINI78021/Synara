import { Router } from "express";
import crypto from "node:crypto";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { requireRider } from "../middleware/requireRider.js";
import { Rider } from "../models/riderModel.js";
import { Order } from "../models/orderModel.js";
import { Booking } from "../models/bookingModel.js";
import { User } from "../models/userModel.js";
import { getPrivateDocumentUrl } from "../config/cloudinary.js";
import { RiderDocument } from "../models/riderDocumentModel.js";
import { publicOpenOrder, publicOpenBooking } from "../services/riderPrivacy.js";
const r = Router();
const s = (v, max = 300) => typeof v === "string" ? v.trim().slice(0, max) : "";
const safeRider = (rider) => ({ riderId: rider.riderId, name: rider.name, phone: rider.phone, vehicleType: rider.vehicleType, vehicleRegistration: rider.vehicleRegistration, serviceZones: rider.serviceZones, documents: Object.fromEntries(["drivingLicence", "governmentId", "vehicleRegistration", "profilePhoto"].map(k => [k, Boolean(rider.documents?.[k]?.publicId)])), status: rider.status, adminNote: rider.adminNote, online: rider.online, completedDeliveries: rider.completedDeliveries, totalEarnings: rider.totalEarnings, payoutMode: rider.payoutMode, fixedPayout: rider.fixedPayout, payoutPerKm: rider.payoutPerKm, createdAt: rider.createdAt });
async function riderByUser(userId) { return Rider.findOne({ user: userId }); }
function payoutFor(rider, distanceKm = 0) { return rider.payoutMode === "distance" ? Math.round((Math.max(0, distanceKm) * rider.payoutPerKm) * 100) / 100 : rider.fixedPayout; }
function kmBetween(a, b) { const rad = d => d * Math.PI / 180; const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng); const x = Math.sin(dLat/2)**2 + Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dLng/2)**2; return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x)); }

// Rider application; document URLs must come from the configured upload service.
r.post("/apply", requireAuth, async (req, res) => {
  if (!req.user.phoneVerified) return res.status(403).json({ error: "Verify your phone number before applying" });
  const prior = await riderByUser(req.user._id);
  if (prior) return res.status(409).json({ error: "A rider application already exists", rider: safeRider(prior) });
  const b = req.body || {};
  const vehicleType = ["motorcycle", "scooter", "bicycle", "other"].includes(b.vehicleType) ? b.vehicleType : "";
  const zones = Array.isArray(b.serviceZones) ? [...new Set(b.serviceZones.map((z) => s(z, 80)).filter(Boolean))].slice(0, 20) : [];
  const validDoc = (d) => d && typeof d.publicId === "string" && d.publicId.startsWith("synara/rider-documents/") && ["image", "raw"].includes(d.resourceType);
  const documents = { drivingLicence: b.drivingLicence, governmentId: b.governmentId, vehicleRegistration: b.vehicleRegistrationDocument, profilePhoto: b.profilePhoto || undefined };
  if (!vehicleType || !s(b.vehicleRegistration, 30) || !validDoc(documents.drivingLicence) || !validDoc(documents.governmentId) || !validDoc(documents.vehicleRegistration) || (documents.profilePhoto && !validDoc(documents.profilePhoto)) || !zones.length) return res.status(400).json({ error: "Vehicle, service zone, and securely uploaded licence, government ID and vehicle registration documents are required" });
  const submittedDocs = [documents.drivingLicence, documents.governmentId, documents.vehicleRegistration, documents.profilePhoto].filter(Boolean);
  const ownedDocs = await RiderDocument.countDocuments({ user: req.user._id, publicId: { $in: submittedDocs.map(d => d.publicId) } });
  if (ownedDocs !== submittedDocs.length) return res.status(400).json({ error: "One or more documents were not uploaded by your account" });
  try {
    const riderId = `SYN-R-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    const rider = await Rider.create({ riderId, user: req.user._id, name: req.user.name, phone: req.user.phone, vehicleType, vehicleOther: s(b.vehicleOther, 80), vehicleRegistration: s(b.vehicleRegistration, 30), serviceZones: zones, documents });
    res.status(201).json({ rider: safeRider(rider), message: "Application submitted. You can accept deliveries after admin approval." });
  } catch (err) { res.status(err.code === 11000 ? 409 : 400).json({ error: err.code === 11000 ? "Rider application already exists" : err.message }); }
});
r.get("/me", requireAuth, async (req, res) => {
  const rider = await riderByUser(req.user._id);
  if (!rider) return res.status(404).json({ error: "No rider application found" });
  res.json({ rider: safeRider(rider) });
});
r.get("/deliveries/open", requireAuth, requireRider, async (req, res) => {
  const zones = req.rider.serviceZones;
  const [candidateOrders, bookings] = await Promise.all([
    Order.find({ status: "open", rider: null }).sort({ createdAt: 1 }).limit(300).select("-deliveryOtpHash").lean(),
    Booking.find({ mode: "pickup", status: "Booked", $and: [{ $or: [{ "delivery.status": "open" }, { "delivery.status": { $exists: false } }] }, { $or: [{ "delivery.rider": null }, { "delivery.rider": { $exists: false } }] }, { $or: [{ "delivery.zone": { $in: zones } }, { "delivery.zone": "" }, { "delivery.zone": { $exists: false } }] }] }).sort({ createdAt: 1 }).limit(100).lean(),
  ]);
  const orders = candidateOrders.filter(order => zones.includes(order.zone) || !order.zone || (req.rider.location?.lat != null && order.destination?.lat != null && kmBetween(req.rider.location, order.destination) <= 15));
  // Before a rider accepts, they only see: area, rough distance, size and value.
  // Customer name, phone, full address and map position are sent after accepting (see /deliveries/mine).
  const roughKm = (point) => (req.rider.location?.lat != null && point?.lat != null ? Math.max(1, Math.ceil(kmBetween(req.rider.location, point))) : null);
  res.json({ orders: orders.map((x) => publicOpenOrder(x, roughKm(x.destination))), bookings: bookings.map(publicOpenBooking) });
});
r.get("/deliveries/mine", requireAuth, requireRider, async (req, res) => {
  const [orders, bookings] = await Promise.all([
    Order.find({ rider: req.rider._id }).sort({ updatedAt: -1 }).select("-deliveryOtpHash").lean(),
    Booking.find({ "delivery.rider": req.rider._id }).sort({ updatedAt: -1 }).lean(),
  ]);
  res.json({ orders: orders.map((x) => ({ ...x, type: "product" })), bookings: bookings.map((x) => ({ ...x, type: "repair" })) });
});
r.post("/deliveries/:type/:id/accept", requireAuth, requireRider, async (req, res) => {
  const { type, id } = req.params;
  if (type === "product") {
    const order = await Order.findOneAndUpdate({ orderId: id, status: "open", rider: null }, { $set: { rider: req.rider._id, riderId: req.rider.riderId, status: "assigned", assignedAt: new Date() }, $push: { events: { status: "assigned", at: new Date(), note: `Accepted by ${req.rider.riderId}` } } }, { new: true, runValidators: true }).select("-deliveryOtpHash");
    if (!order) return res.status(409).json({ error: "This order is no longer available" });
    return res.json({ delivery: order, message: "Order accepted" });
  }
  if (type === "repair") {
    const booking = await Booking.findOneAndUpdate({ id, mode: "pickup", status: "Booked", $and: [{ $or: [{ "delivery.rider": null }, { "delivery.rider": { $exists: false } }] }, { $or: [{ "delivery.status": "open" }, { "delivery.status": { $exists: false } }] }] }, { $set: { "delivery.rider": req.rider._id, "delivery.riderId": req.rider.riderId, "delivery.status": "assigned", "delivery.assignedAt": new Date() } }, { new: true, runValidators: true });
    if (!booking) return res.status(409).json({ error: "This repair pickup is no longer available" });
    return res.json({ delivery: booking, message: "Repair pickup accepted" });
  }
  res.status(400).json({ error: "Unknown delivery type" });
});
r.patch("/deliveries/:type/:id/status", requireAuth, requireRider, async (req, res) => {
  const { type, id } = req.params, status = s(req.body?.status, 30);
  const allowed = { product: ["picked_up", "out_for_delivery", "delivered"], repair: ["picked_up", "at_shop", "returning", "delivered"] };
  if (!allowed[type]?.includes(status)) return res.status(400).json({ error: "Invalid delivery status" });
  const now = new Date();
  if (type === "product") {
    if (status === "delivered") {
      const code = s(req.body?.otp, 6);
      if (!/^\d{6}$/.test(code)) return res.status(400).json({ error: "Enter the customer's 6-digit delivery OTP" });
      const orderForOtp = await Order.findOne({ orderId: id, rider: req.rider._id, status: "out_for_delivery" }).select("+deliveryOtpHash");
      const submittedHash = crypto.createHash("sha256").update(`${code}:${process.env.AUTH_TOKEN_SECRET}`).digest("hex");
      if (!orderForOtp || orderForOtp.deliveryOtpHash !== submittedHash) return res.status(400).json({ error: "Invalid OTP or order is not out for delivery" });
    }
    const expectedCurrent = { picked_up: "assigned", out_for_delivery: "picked_up", delivered: "out_for_delivery" }[status];
    const update = { status };
    if (status === "picked_up") update.pickedUpAt = now;
    if (status === "delivered") update.deliveredAt = now;
    const order = await Order.findOneAndUpdate({ orderId: id, rider: req.rider._id, status: expectedCurrent }, { $set: update, $push: { events: { status, at: now, note: "Updated by assigned rider" } } }, { new: true }).select("-deliveryOtpHash");
    if (!order) return res.status(404).json({ error: "Delivery not found or status transition is not allowed" });
    if (status === "delivered") { await Order.updateOne({ _id: order._id }, { $unset: { deliveryOtpHash: 1 } }); const payout = payoutFor(req.rider, order.distanceKm || 0); await Rider.updateOne({ _id: req.rider._id }, { $inc: { completedDeliveries: 1, totalEarnings: payout } }); await Order.updateOne({ _id: order._id }, { $set: { riderPayout: payout } }); }
    return res.json({ delivery: order });
  }
  if (status === "delivered" && !req.body?.proof?.publicId) return res.status(400).json({ error: "Upload delivery proof before completing a repair return" });
  if (status === "delivered") { const proof = await RiderDocument.findOne({ user: req.user._id, publicId: req.body.proof.publicId, resourceType: req.body.proof.resourceType }); if (!proof) return res.status(400).json({ error: "Delivery proof was not uploaded by your account" }); }
  const expectedCurrent = { picked_up: "assigned", at_shop: "picked_up", returning: "at_shop", delivered: "returning" }[status];
  const update = { "delivery.status": status };
  if (status === "delivered") update["delivery.proof"] = req.body.proof;
  if (status === "picked_up") update["delivery.pickedUpAt"] = now;
  if (status === "delivered") update["delivery.deliveredAt"] = now;
  const booking = await Booking.findOneAndUpdate({ id, "delivery.rider": req.rider._id, "delivery.status": expectedCurrent }, { $set: update }, { new: true });
  if (!booking) return res.status(404).json({ error: "Repair delivery not found or status transition is not allowed" });
  if (status === "delivered") { const payout = payoutFor(req.rider, booking.delivery?.distanceKm || 0); await Rider.updateOne({ _id: req.rider._id }, { $inc: { completedDeliveries: 1, totalEarnings: payout } }); await Booking.updateOne({ _id: booking._id }, { $set: { "delivery.riderPayout": payout } }); }
  res.json({ delivery: booking });
});
r.patch("/deliveries/:type/:id/location", requireAuth, requireRider, async (req, res) => {
  const lat = Number(req.body?.lat), lng = Number(req.body?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return res.status(400).json({ error: "Valid latitude and longitude are required" });
  const location = { lat, lng, updatedAt: new Date() };
  await Rider.updateOne({ _id: req.rider._id }, { $set: { location, online: true } });
  if (req.params.type === "product") await Order.updateOne({ orderId: req.params.id, rider: req.rider._id }, { $set: { riderLocation: location } });
  else if (req.params.type === "repair") await Booking.updateOne({ id: req.params.id, "delivery.rider": req.rider._id }, { $set: { "delivery.riderLocation": location } });
  else return res.status(400).json({ error: "Unknown delivery type" });
  res.json({ ok: true });
});
r.patch("/deliveries/:type/:id/proof", requireAuth, requireRider, async (req, res) => {
  const proof = req.body?.proof;
  if (!proof || typeof proof.publicId !== "string" || !proof.publicId.startsWith("synara/rider-documents/") || !["image", "raw"].includes(proof.resourceType)) return res.status(400).json({ error: "Upload a delivery photo or document first" });
  const ownedProof = await RiderDocument.findOne({ user: req.user._id, publicId: proof.publicId, resourceType: proof.resourceType });
  if (!ownedProof) return res.status(400).json({ error: "Proof file was not uploaded by your account" });
  if (req.params.type === "product") {
    const updated = await Order.findOneAndUpdate({ orderId: req.params.id, rider: req.rider._id }, { $set: { deliveryProof: proof } }, { new: true }).select("orderId deliveryProof");
    if (!updated) return res.status(404).json({ error: "Order not found" });
    return res.json({ ok: true, delivery: updated });
  }
  if (req.params.type === "repair") {
    const updated = await Booking.findOneAndUpdate({ id: req.params.id, "delivery.rider": req.rider._id }, { $set: { "delivery.proof": proof } }, { new: true });
    if (!updated) return res.status(404).json({ error: "Booking not found" });
    return res.json({ ok: true, delivery: updated });
  }
  res.status(400).json({ error: "Unknown delivery type" });
});
r.patch("/location", requireAuth, requireRider, async (req, res) => {
  const lat = Number(req.body?.lat), lng = Number(req.body?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return res.status(400).json({ error: "Valid latitude and longitude are required" });
  req.rider.location = { lat, lng, updatedAt: new Date() }; req.rider.online = true; await req.rider.save();
  res.json({ ok: true, location: req.rider.location });
});
r.patch("/availability", requireAuth, requireRider, async (req, res) => {
  const online = req.body?.online;
  if (typeof online !== "boolean") return res.status(400).json({ error: "online must be boolean" });
  req.rider.online = online; await req.rider.save(); res.json({ online });
});
r.get("/earnings", requireAuth, requireRider, async (req, res) => {
  const [orders, bookings] = await Promise.all([Order.find({ rider: req.rider._id, status: "delivered" }).select("orderId total riderPayout deliveredAt payoutSettled").lean(), Booking.find({ "delivery.rider": req.rider._id, "delivery.status": "delivered" }).select("id service delivery.riderPayout delivery.deliveredAt").lean()]);
  res.json({ riderId: req.rider.riderId, totalEarnings: req.rider.totalEarnings, completedDeliveries: req.rider.completedDeliveries, deliveries: [...orders.map(x => ({ type: "product", id: x.orderId, amount: x.riderPayout || 0, at: x.deliveredAt, settled: x.payoutSettled })), ...bookings.map(x => ({ type: "repair", id: x.id, amount: x.delivery?.riderPayout || 0, at: x.delivery?.deliveredAt, settled: false }))] });
});

// Admin endpoints retain the project's existing x-admin-key authorization.
r.get("/admin", requireAdmin, async (_req, res) => {
  const riders = await Rider.find().sort({ createdAt: -1 }).lean();
  const result = await Promise.all(riders.map(async (rider) => {
    const item = safeRider(rider);
    for (const key of ["drivingLicence", "governmentId", "vehicleRegistration", "profilePhoto"]) {
      const doc = rider.documents?.[key];
      item.documents[key] = doc?.publicId ? getPrivateDocumentUrl(doc.publicId, doc.format, doc.resourceType) : "";
    }
    return item;
  }));
  res.json(result);
});
r.patch("/admin/:riderId/status", requireAdmin, async (req, res) => {
  const status = s(req.body?.status, 20);
  if (! ["approved", "rejected", "suspended", "pending"].includes(status)) return res.status(400).json({ error: "Invalid rider status" });
  const rider = await Rider.findOneAndUpdate({ riderId: req.params.riderId }, { $set: { status, adminNote: s(req.body?.adminNote, 500), approvedAt: status === "approved" ? new Date() : null, approvedBy: status === "approved" ? "admin-key" : null } }, { new: true, runValidators: true });
  if (!rider) return res.status(404).json({ error: "Rider not found" });
  res.json({ rider: safeRider(rider) });
});
r.patch("/admin/:riderId/payout", requireAdmin, async (req, res) => {
  const payoutMode = s(req.body?.payoutMode, 20);
  const fixedPayout = Number(req.body?.fixedPayout), payoutPerKm = Number(req.body?.payoutPerKm);
  if (!["fixed", "distance"].includes(payoutMode) || !Number.isFinite(fixedPayout) || fixedPayout < 0 || fixedPayout > 10000 || !Number.isFinite(payoutPerKm) || payoutPerKm < 0 || payoutPerKm > 1000) return res.status(400).json({ error: "Enter a valid payout mode and rates" });
  const rider = await Rider.findOneAndUpdate({ riderId: req.params.riderId }, { $set: { payoutMode, fixedPayout, payoutPerKm } }, { new: true, runValidators: true });
  if (!rider) return res.status(404).json({ error: "Rider not found" });
  res.json({ rider: safeRider(rider) });
});
r.get("/admin/deliveries", requireAdmin, async (req, res) => {
  const [orders, bookings, riders] = await Promise.all([Order.find({ status: { $nin: ["delivered", "cancelled"] } }).sort({ createdAt: -1 }).select("-deliveryOtpHash").lean(), Booking.find({ mode: "pickup", status: "Booked", "delivery.status": { $nin: ["delivered", "cancelled"] } }).sort({ createdAt: -1 }).lean(), Rider.find({ status: "approved" }).select("riderId name phone serviceZones vehicleType").lean()]);
  res.json({ orders: orders.map(x => ({ ...x, type: "product" })), bookings: bookings.map(x => ({ ...x, type: "repair" })), riders });
});
r.patch("/admin/assign/:type/:id", requireAdmin, async (req, res) => {
  const rider = await Rider.findOne({ riderId: s(req.body?.riderId, 30), status: "approved" });
  if (!rider) return res.status(400).json({ error: "Select an approved rider" });
  if (req.params.type === "product") {
    const distanceKm = Number(req.body?.distanceKm);
    const distanceUpdate = Number.isFinite(distanceKm) && distanceKm >= 0 && distanceKm <= 500 ? { distanceKm } : {};
    const order = await Order.findOneAndUpdate({ orderId: req.params.id, status: { $in: ["open", "assigned"] } }, { $set: { rider: rider._id, riderId: rider.riderId, status: "assigned", assignedAt: new Date(), ...distanceUpdate }, $push: { events: { status: "assigned", at: new Date(), note: "Assigned by admin" } } }, { new: true }).select("-deliveryOtpHash");
    if (!order) return res.status(409).json({ error: "Order is not assignable" });
    return res.json({ delivery: order });
  }
  if (req.params.type === "repair") {
    const distanceKm = Number(req.body?.distanceKm);
    const distanceUpdate = Number.isFinite(distanceKm) && distanceKm >= 0 && distanceKm <= 500 ? { "delivery.distanceKm": distanceKm } : {};
    const booking = await Booking.findOneAndUpdate({ id: req.params.id, mode: "pickup", status: "Booked", "delivery.status": { $nin: ["picked_up", "at_shop", "returning", "delivered"] } }, { $set: { "delivery.rider": rider._id, "delivery.riderId": rider.riderId, "delivery.status": "assigned", "delivery.assignedAt": new Date(), ...distanceUpdate } }, { new: true });
    if (!booking) return res.status(409).json({ error: "Repair pickup is not assignable" });
    return res.json({ delivery: booking });
  }
  res.status(400).json({ error: "Unknown delivery type" });
});
export default r;