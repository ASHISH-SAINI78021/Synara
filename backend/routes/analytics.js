import { Router } from "express";
import { Product } from "../models/productModel.js";
import { Repair } from "../models/repairModel.js";
import { Booking } from "../models/bookingModel.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const r = Router();
const daysBetween = (a, b) => Math.floor((b - a) / 86400000);
const money = (n) => Math.round((Number(n) || 0) * 100) / 100;

// This dashboard intentionally reports only what the current schema can support.
// Orders, item-level sales, costs, delivery outcomes and satisfaction data are not
// currently modeled, so those insights are surfaced as data gaps rather than guesses.
r.get("/", requireAdmin, async (_req, res) => {
  try {
    const [products, repairs, bookings] = await Promise.all([
      Product.find({}).lean(), Repair.find({}).lean(), Booking.find({}).sort({ createdAt: -1 }).lean(),
    ]);
    const now = new Date();
    const start30 = new Date(now); start30.setDate(start30.getDate() - 30);
    const start90 = new Date(now); start90.setDate(start90.getDate() - 90);
    const completed = bookings.filter(b => b.status === "Completed");
    const active = bookings.filter(b => b.status === "Booked");
    const customerMap = new Map();
    for (const b of bookings) {
      const key = String(b.phone || b.name || b.id).trim().toLowerCase();
      if (!customerMap.has(key)) customerMap.set(key, { name: b.name || "Customer", phone: b.phone || "", count: 0, completed: 0, value: 0, lastSeen: null, firstSeen: null });
      const c = customerMap.get(key); c.count += 1;
      if (b.status === "Completed") { c.completed += 1; c.value += Number(b.price) || 0; }
      const d = new Date(b.createdAt || b.date || now);
      if (!Number.isNaN(+d)) { if (!c.lastSeen || d > c.lastSeen) c.lastSeen = d; if (!c.firstSeen || d < c.firstSeen) c.firstSeen = d; }
    }
    const customers = [...customerMap.values()].sort((a,b) => b.value - a.value);
    const repeat = customers.filter(c => c.count > 1);
    const daily = new Map();
    for (const b of bookings) {
      const d = new Date(b.createdAt || b.date);
      if (Number.isNaN(+d)) continue;
      const label = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
      daily.set(label, (daily.get(label) || 0) + 1);
    }
    const zones = new Map();
    for (const b of bookings) {
      const zone = b.mode === "shop" ? "In-store" : (String(b.address || "Unspecified").split(",").slice(-2).join(",").trim() || "Unspecified");
      zones.set(zone, (zones.get(zone) || 0) + 1);
    }
    const lowStock = products.filter(p => Number.isFinite(Number(p.stock)) && Number(p.stock) <= 5).sort((a,b) => Number(a.stock)-Number(b.stock));
    const outOfStock = products.filter(p => Number.isFinite(Number(p.stock)) && Number(p.stock) <= 0);
    const serviceCounts = new Map();
    for (const b of bookings) serviceCounts.set(b.service || "Unspecified", (serviceCounts.get(b.service || "Unspecified") || 0) + 1);
    const avgGapDays = customers.filter(c => c.count > 1 && c.firstSeen && c.lastSeen).map(c => daysBetween(c.firstSeen,c.lastSeen)/(c.count-1));
    const grossRecorded = completed.reduce((s,b) => s + (Number(b.price)||0), 0);
    const bookings30 = bookings.filter(b => new Date(b.createdAt || b.date) >= start30).length;
    const bookings90 = bookings.filter(b => new Date(b.createdAt || b.date) >= start90).length;
    res.json({
      generatedAt: now.toISOString(),
      coverage: { customers: bookings.length > 0, bookings: true, products: true, orders: false, itemLevelSales: false, costs: false, deliveryOutcomes: false, satisfaction: false },
      overview: { totalBookings: bookings.length, completedBookings: completed.length, openBookings: active.length, cancelledBookings: bookings.filter(b=>b.status === "Cancelled").length, bookings30, bookings90, uniqueCustomers: customers.length, repeatCustomers: repeat.length, repeatRate: customers.length ? repeat.length/customers.length : 0, recordedCompletedServiceRevenue: money(grossRecorded), averageRecordedServiceValue: completed.length ? money(grossRecorded/completed.length) : 0, productCount: products.length, repairServiceCount: repairs.length },
      customers: customers.slice(0,10).map(c=>({ name:c.name, bookingCount:c.count, completedJobs:c.completed, recordedServiceValue:money(c.value), lastSeen:c.lastSeen?.toISOString() || null, segment:c.count > 1 ? "Repeat service customer" : "Single booking" })),
      repeat: { repeatCustomers: repeat.length, oneTimeCustomers: customers.filter(c=>c.count===1).length, averageGapDays: avgGapDays.length ? Math.round(avgGapDays.reduce((a,b)=>a+b,0)/avgGapDays.length) : null },
      demand: { recentDailyBookings: [...daily.entries()].slice(-14).map(([date,count])=>({date,count})), topServices:[...serviceCounts.entries()].map(([service,count])=>({service,count})).sort((a,b)=>b.count-a.count).slice(0,6), bookingModes:[{mode:"Pickup",count:bookings.filter(b=>b.mode==="pickup").length},{mode:"Shop visit",count:bookings.filter(b=>b.mode==="shop").length}], zones:[...zones.entries()].map(([zone,count])=>({zone,count})).sort((a,b)=>b.count-a.count).slice(0,6) },
      inventory: { lowStock:lowStock.slice(0,10).map(p=>({name:p.name,stock:Number(p.stock)})), lowStockCount:lowStock.length, outOfStockCount:outOfStock.length },
      insights: [
        { id:"clv", title:"Customer lifetime value", status:"partial", value:"Service bookings only", detail:"Ranks customers by recorded completed repair value. This is not gross profit or full CLV; product orders and attributable costs are not modeled." },
        { id:"repeat", title:"Repeat purchase prediction", status:"partial", value:`${repeat.length} repeat service customers`, detail:"Uses repeat repair bookings as a proxy. Product repurchase intervals and predictive scoring require order history." },
        { id:"next", title:"Likely next purchase", status:"unavailable", value:"Needs order-line data", detail:"Product recommendations need product-level purchase history and compatible-product relationships." },
        { id:"demand", title:"When and where demand occurs", status:"available", value:`${bookings30} bookings in 30 days`, detail:"Uses booking creation dates, service types, booking mode and address text. It does not represent product sales demand." },
        { id:"profit", title:"Profitability by customer and product", status:"unavailable", value:"Needs cost data", detail:"Current records do not contain product cost, fees, delivery subsidies, discounts or refunds needed for contribution margin." },
        { id:"segments", title:"Customer segments", status:"partial", value:`${customers.length} identified customers`, detail:"Segments are based on repair booking frequency only; discount sensitivity and shopping behavior need sales/order data." },
        { id:"forecast", title:"Demand and inventory forecasting", status:products.some(p=>Number.isFinite(Number(p.stock))) ? "partial" : "unavailable", value:`${lowStock.length} low-stock items`, detail:"Shows current stock warnings. Reliable forecasts need dated product sales and replenishment lead times." },
        { id:"churn", title:"Customers at risk of leaving", status:"partial", value:"Rule-based follow-up", detail:"Customers with old or one-time bookings can be reviewed, but churn prediction needs a longer, reliable transaction history." },
        { id:"delivery", title:"Delivery and service-area intelligence", status:"partial", value:`${zones.size} booking areas/modes`, detail:"Booking locations and pickup/shop mode are available; delivery distance, failure, cost and order-density data are not." },
        { id:"satisfaction", title:"Customer satisfaction and problems", status:"unavailable", value:"Needs feedback outcomes", detail:"Ratings, complaints, refunds, repair rework and delivery failures are not currently captured in the backend schema." },
      ],
      dataGaps: ["Order and order-line records (customer, products, quantity, date, status, discounts, refunds)", "Product cost and attributable transaction/delivery costs", "Delivery zone, distance, delivery status and failure reason", "Customer ratings, complaints, repair rework and resolution outcome"],
    });
  } catch (err) {
    console.error("Analytics failed", err);
    res.status(500).json({ error: "Failed to build analytics" });
  }
});
export default r;
