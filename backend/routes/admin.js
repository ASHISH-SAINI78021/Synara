
import { Router } from "express";
import { Product } from "../models/productModel.js";
import { Repair } from "../models/repairModel.js";
import { Booking } from "../models/bookingModel.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const r = Router();

r.get("/stats", requireAdmin, async (req, res) => {
  try {
    const [products, repairs, bookings] = await Promise.all([
      Product.find({}).lean(),
      Repair.find({}).lean(),
      Booking.find({}).sort({ createdAt: -1 }).lean(),
    ]);

    // Preserve the existing dashboard response fields.
    const bookingCounts = bookings.reduce((result, booking) => {
      const status = booking.status || "Unknown";
      result[status] = (result[status] || 0) + 1;
      return result;
    }, {});

    // Booking date and completion metrics.
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    const completedBookings = bookings.filter(
      (booking) => booking.status === "Completed"
    );

    const recentBookings = bookings.filter((booking) => {
      const created = new Date(booking.createdAt).getTime();
      return Number.isFinite(created) && created >= thirtyDaysAgo;
    });

    const recordedRevenue = completedBookings.reduce(
      (total, booking) => total + (Number(booking.price) || 0),
      0
    );

    // Group customers by phone number where available.
    const customerMap = new Map();

    for (const booking of bookings) {
      const phone = String(booking.phone || "").trim();
      const name = String(booking.name || "").trim();

      // Don't merge unrelated customers when no identifier exists.
      const customerKey = phone
        ? `phone:${phone}`
        : name
          ? `name:${name.toLowerCase()}`
          : null;

      if (!customerKey) continue;

      if (!customerMap.has(customerKey)) {
        customerMap.set(customerKey, {
          name: name || "Customer",
          bookingCount: 0,
          completedJobs: 0,
          recordedServiceValue: 0,
        });
      }

      const customer = customerMap.get(customerKey);
      customer.bookingCount += 1;

      if (booking.status === "Completed") {
        customer.completedJobs += 1;
        customer.recordedServiceValue += Number(booking.price) || 0;
      }
    }

    const customerRecords = [...customerMap.values()];
    const repeatCustomers = customerRecords.filter(
      (customer) => customer.bookingCount > 1
    ).length;

    const uniqueCustomers = customerRecords.length;
    const repeatRate = uniqueCustomers
      ? repeatCustomers / uniqueCustomers
      : 0;

    const customers = customerRecords
      .filter((customer) => customer.completedJobs > 0)
      .sort(
        (a, b) =>
          b.recordedServiceValue - a.recordedServiceValue
      )
      .slice(0, 10)
      .map((customer) => ({
        ...customer,
        segment:
          customer.bookingCount > 1 ? "Repeat" : "Single booking",
      }));

    // Service demand and booking modes.
    const serviceCounts = new Map();
    const modeCounts = new Map();

    for (const booking of bookings) {
      const service = booking.service || "Unspecified";
      const mode = booking.mode || "Unspecified";

      serviceCounts.set(
        service,
        (serviceCounts.get(service) || 0) + 1
      );

      modeCounts.set(mode, (modeCounts.get(mode) || 0) + 1);
    }

    const topServices = [...serviceCounts.entries()]
      .map(([service, count]) => ({ service, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const bookingModes = [...modeCounts.entries()].map(
      ([mode, count]) => ({ mode, count })
    );

    // Inventory: only count products with numeric stock values.
    const stockedProducts = products.filter(
      (product) =>
        product.stock !== undefined &&
        product.stock !== null &&
        Number.isFinite(Number(product.stock))
    );

    const lowStock = stockedProducts
      .filter((product) => Number(product.stock) <= 5)
      .sort(
        (a, b) => Number(a.stock) - Number(b.stock)
      )
      .map((product) => ({
        id: product.id,
        name: product.name,
        stock: Number(product.stock),
      }));

    const lowStockCount = lowStock.length;
    const outOfStockCount = stockedProducts.filter(
      (product) => Number(product.stock) <= 0
    ).length;

    // These are operational indicators, not financial forecasts.
    const insights = [
      {
        id: "clv",
        title: "Top recorded service value",
        value: customers.length
          ? `₹${Math.round(customers[0].recordedServiceValue).toLocaleString("en-IN")}`
          : "No data",
        detail:
          "Highest recorded completed repair-booking value among identified customers.",
        status: customers.length ? "partial" : "unavailable",
      },
      {
        id: "repeat",
        title: "Repeat service customers",
        value: `${Math.round(repeatRate * 100)}%`,
        detail: `${repeatCustomers} repeat customers among ${uniqueCustomers} identified customers.`,
        status: uniqueCustomers ? "partial" : "unavailable",
      },
      {
        id: "next",
        title: "Recent booking activity",
        value: String(recentBookings.length),
        detail: "Bookings created during the last 30 days.",
        status: "available",
      },
      {
        id: "demand",
        title: "Most requested service",
        value: topServices[0]?.service || "No data",
        detail: topServices.length
          ? `${topServices[0].count} recorded bookings for this service.`
          : "No service bookings recorded yet.",
        status: topServices.length ? "available" : "unavailable",
      },
      {
        id: "profit",
        title: "Completed service value",
        value: `₹${Math.round(recordedRevenue).toLocaleString("en-IN")}`,
        detail: "Sum of recorded prices for completed bookings; not profit.",
        status: completedBookings.length ? "partial" : "unavailable",
      },
      {
        id: "segments",
        title: "Identified customers",
        value: String(uniqueCustomers),
        detail: "Customers grouped by phone number or, when unavailable, name.",
        status: uniqueCustomers ? "partial" : "unavailable",
      },
      {
        id: "forecast",
        title: "Low-stock products",
        value: String(lowStockCount),
        detail: "Products with recorded stock of five units or fewer.",
        status: stockedProducts.length ? "available" : "unavailable",
      },
      {
        id: "churn",
        title: "Uncompleted bookings",
        value: String(
          bookings.filter((booking) => booking.status === "Booked").length
        ),
        detail: "Bookings currently marked Booked; this is not a churn prediction.",
        status: "available",
      },
      {
        id: "delivery",
        title: "Pickup bookings",
        value: String(
          bookings.filter((booking) => booking.mode === "pickup").length
        ),
        detail: "Bookings whose recorded mode is pickup.",
        status: "available",
      },
      {
        id: "satisfaction",
        title: "Customer satisfaction",
        value: "Data needed",
        detail: "Customer ratings and feedback are not available in this calculation.",
        status: "unavailable",
      },
    ];

    const dataGaps = [
      "Product order-line and purchase history for product-level customer value.",
      "Product acquisition costs and operating expenses for profit calculations.",
      "Historical demand data for reliable forecasting.",
      "Customer ratings and feedback for satisfaction analysis.",
      "Customer identifiers should be consistent for more reliable repeat-customer analysis.",
    ];

    res.json({
      // Existing AdminPage.jsx depends on these fields.
      products: products.length,
      repairs: repairs.length,
      bookings: bookingCounts,

      // AnalyticsTab.jsx fields.
      overview: {
        totalBookings: bookings.length,
        bookings30: recentBookings.length,
        repeatRate,
        repeatCustomers,
        uniqueCustomers,
        recordedCompletedServiceRevenue: recordedRevenue,
      },

      inventory: {
        lowStockCount,
        outOfStockCount,
        lowStock,
      },

      insights,
      customers,
      demand: {
        topServices,
        bookingModes,
      },
      dataGaps,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Admin stats error:", error);

    res.status(500).json({
      error: "Failed to fetch admin statistics",
    });
  }
});

// Validate the existing admin key.
r.get("/check", requireAdmin, (_req, res) => {
  res.json({ ok: true });
});

export default r;
