
import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Boxes,
  BrainCircuit,
  CircleHelp,
  RefreshCw,
  Users,
} from "lucide-react";
import styles from "./Admin.module.css";

const currency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const pct = (value) =>
  `${Math.round((Number(value) || 0) * 100)}%`;

const STATUS = {
  available: "Available",
  partial: "Partial data",
  unavailable: "Data needed",
};

const ICONS = {
  clv: Users,
  repeat: Activity,
  next: ArrowUpRight,
  demand: BarChart3,
  profit: CircleHelp,
  segments: Users,
  forecast: Boxes,
  churn: BrainCircuit,
  delivery: BarChart3,
  satisfaction: AlertTriangle,
};

const isObject = (value) =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value);

const asArray = (value) =>
  Array.isArray(value) ? value : [];

const getErrorMessage = (error) => {
  if (error?.status === 404) {
    return "The /admin/stats endpoint was not found. Check your backend route.";
  }

  if (error?.status === 401 || error?.status === 403) {
    return "Admin authentication failed. Please sign in again.";
  }

  return error?.message || "Unable to load analytics.";
};

export default function AnalyticsTab({ call }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      // Use the existing analytics endpoint.
      const result = await call("/admin/stats");

      if (!isObject(result)) {
        throw new Error("The stats API returned an invalid response.");
      }

      // The endpoint must return the analytics data structure.
      if (!isObject(result.overview)) {
        console.error(
          "Unexpected /admin/stats response:",
          result
        );

        throw new Error(
          "The /admin/stats response has no overview object. " +
          "Check the backend response structure."
        );
      }

      setData(result);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [call]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !data) {
    return (
      <section className={styles.analytics}>
        <p>Building your business insights…</p>
      </section>
    );
  }

  if (error && !data) {
    return (
      <section className={styles.analytics}>
        <p className={styles.analyticsError} role="alert">
          {error}
        </p>

        <button
          type="button"
          className={styles.ghost}
          onClick={load}
          disabled={loading}
        >
          <RefreshCw size={15} />
          Try again
        </button>
        <p className={styles.panelHint}>
          Check the browser Network tab for the response from
          /api/admin/stats.
        </p>
      </section>
    );
  }

  if (!data) {
    return null;
  }

  const o = data.overview || {};
  const inventory = data.inventory || {};
  const demand = data.demand || {};

  const insights = asArray(data.insights);
  const customers = asArray(data.customers);
  const topServices = asArray(demand.topServices);
  const bookingModes = asArray(demand.bookingModes);
  const lowStock = asArray(inventory.lowStock);
  const dataGaps = asArray(data.dataGaps);

  const topServiceCount = Math.max(
    1,
    Number(topServices[0]?.count) || 0
  );

  return (
    <section className={styles.analytics}>
      <div className={styles.analyticsHead}>
        <div>
          <p className={styles.analyticsEyebrow}>
            SYNARA INTELLIGENCE
          </p>

          <h2>Business insights</h2>

          <p>
            Turn your operational data into clear next steps.
          </p>
        </div>

        <button
          type="button"
          className={styles.ghost}
          onClick={load}
          disabled={loading}
        >
          <RefreshCw size={15} />
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {error && (
        <p className={styles.analyticsError} role="alert">
          Refresh failed: {error}
        </p>
      )}

      <div className={styles.analyticsNotice}>
        <AlertTriangle size={18} />

        <div>
          <strong>Data coverage matters</strong>

          <p>
            These insights are calculated from current product,
            repair-service and repair-booking records. Order-line
            history, cost accounting, delivery outcomes and
            customer feedback may not be available, so some
            insights can be partial or unavailable.
          </p>
        </div>
      </div>

      <div className={styles.analyticsKpis}>
        <div className={styles.analyticsKpi}>
          <span>Total repair bookings</span>
          <strong>{o.totalBookings ?? "—"}</strong>
          <small>
            {o.bookings30 ?? "—"} created in the last 30 days
          </small>
        </div>

        <div className={styles.analyticsKpi}>
          <span>Repeat service customers</span>
          <strong>
            {o.repeatRate != null ? pct(o.repeatRate) : "—"}
          </strong>
          <small>
            {o.repeatCustomers ?? "—"} of{" "}
            {o.uniqueCustomers ?? "—"} identified customers
          </small>
        </div>

        <div className={styles.analyticsKpi}>
          <span>Completed service value</span>
          <strong>
            {o.recordedCompletedServiceRevenue != null
              ? currency(o.recordedCompletedServiceRevenue)
              : "—"}
          </strong>
          <small>Recorded booking price, not profit</small>
        </div>

        <div className={styles.analyticsKpi}>
          <span>Low-stock products</span>
          <strong>{inventory.lowStockCount ?? "—"}</strong>
          <small>
            {inventory.outOfStockCount ?? "—"} marked out of stock
          </small>
        </div>
      </div>

      <div className={styles.analyticsSectionHead}>
        <div>
          <h3>The 10 most valuable insights</h3>
          <p>
            Availability reflects the fields currently stored
            by your backend.
          </p>
        </div>
      </div>

      <div className={styles.insightGrid}>
        {insights.length ? (
          insights.map((insight, index) => {
            const Icon = ICONS[insight.id] || Activity;

            return (
              <article
                className={styles.insightCard}
                key={insight.id || `insight-${index}`}
              >
                <div className={styles.insightTop}>
                  <span className={styles.insightIcon}>
                    <Icon size={18} />
                  </span>

                  <span
                    className={`${styles.insightStatus} ${
                      styles[`status_${insight.status}`] || ""
                    }`}
                  >
                    {STATUS[insight.status] || "Data needed"}
                  </span>
                </div>

                <p className={styles.insightNumber}>
                  {String(index + 1).padStart(2, "0")}
                </p>

                <h4>{insight.title || "Business insight"}</h4>

                <strong className={styles.insightValue}>
                  {insight.value ?? "—"}
                </strong>

                <p>
                  {insight.detail ||
                    "More information is needed to provide this insight."}
                </p>
              </article>
            );
          })
        ) : (
          <p>No insights are available in the API response yet.</p>
        )}
      </div>

      <div className={styles.analyticsColumns}>
        <section className={styles.analyticsPanel}>
          <h3>Top customers by completed repair value</h3>

          <p className={styles.panelHint}>
            A service-value proxy only; not product CLV or gross
            profit.
          </p>

          {customers.length ? (
            <div className={styles.analyticsTableWrap}>
              <table className={styles.analyticsTable}>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Bookings</th>
                    <th>Completed jobs</th>
                    <th>Recorded value</th>
                    <th>Segment</th>
                  </tr>
                </thead>

                <tbody>
                  {customers.map((customer, index) => (
                    <tr
                      key={`${customer.name || "customer"}-${index}`}
                    >
                      <td>{customer.name || "Unknown"}</td>
                      <td>{customer.bookingCount ?? 0}</td>
                      <td>{customer.completedJobs ?? 0}</td>
                      <td>
                        {currency(customer.recordedServiceValue)}
                      </td>
                      <td>{customer.segment || "Unclassified"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No booking history available yet.</p>
          )}
        </section>

        <section className={styles.analyticsPanel}>
          <h3>Demand signals</h3>

          <p className={styles.panelHint}>
            Based on repair bookings, not product orders.
          </p>

          <h4>Most requested services</h4>

          {topServices.length ? (
            topServices.map((service, index) => (
              <div
                className={styles.barRow}
                key={service.service || `service-${index}`}
              >
                <span>{service.service || "Other"}</span>

                <div className={styles.barTrack}>
                  <i
                    style={{
                      width: `${
                        Math.max(
                          4,
                          ((Number(service.count) || 0) /
                            topServiceCount) *
                            100
                        )
                      }%`,
                    }}
                  />
                </div>

                <b>{service.count ?? 0}</b>
              </div>
            ))
          ) : (
            <p>No service booking data yet.</p>
          )}

          <h4 className={styles.subPanelTitle}>Booking mode</h4>

          {bookingModes.length ? (
            bookingModes.map((mode, index) => (
              <div
                className={styles.simpleRow}
                key={mode.mode || `mode-${index}`}
              >
                <span>{mode.mode || "Unspecified"}</span>
                <strong>{mode.count ?? 0}</strong>
              </div>
            ))
          ) : (
            <p>No booking-mode data available yet.</p>
          )}
        </section>
      </div>

      <div className={styles.analyticsColumns}>
        <section className={styles.analyticsPanel}>
          <h3>Inventory attention</h3>

          {lowStock.length ? (
            lowStock.map((product, index) => (
              <div
                className={styles.simpleRow}
                key={product.id || product._id || `${product.name}-${index}`}
              >
                <span>{product.name || "Unnamed product"}</span>

                <strong
                  className={
                    Number(product.stock) <= 0
                      ? styles.stockBad
                      : styles.stockWarn
                  }
                >
                  {Number(product.stock) <= 0
                    ? "Out of stock"
                    : `${product.stock} left`}
                </strong>
              </div>
            ))
          ) : (
            <p>
              No low-stock products were returned, or stock quantities
              are not recorded.
            </p>
          )}
        </section>

        <section className={styles.analyticsPanel}>
          <h3>What to add for full intelligence</h3>

          <p className={styles.panelHint}>
            These data sources can unlock more reliable predictions
            and profit metrics.
          </p>

          {dataGaps.length ? (
            <ul className={styles.dataGapList}>
              {dataGaps.map((gap, index) => (
                <li key={`${gap}-${index}`}>{gap}</li>
              ))}
            </ul>
          ) : (
            <p>No data-gap information was returned by the API.</p>
          )}
        </section>
      </div>

      <p className={styles.analyticsFootnote}>
        <Activity size={14} />
        Last generated:{" "}
        {data.generatedAt &&
        !Number.isNaN(Date.parse(data.generatedAt))
          ? new Date(data.generatedAt).toLocaleString()
          : "Not provided"}
        {" "}· Forecasts and customer classifications should be
        validated as more data becomes available.
      </p>
    </section>
  );
}
