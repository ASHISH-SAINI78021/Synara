import { Rider } from "../models/riderModel.js";
export async function requireRider(req, res, next) {
  try {
    const rider = await Rider.findOne({ user: req.user._id });
    if (!rider) return res.status(403).json({ error: "Complete rider registration first" });
    if (rider.status !== "approved") return res.status(403).json({ error: `Rider account is ${rider.status}; admin approval is required` });
    req.rider = rider;
    next();
  } catch (err) { next(err); }
}