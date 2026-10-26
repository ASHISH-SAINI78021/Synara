
import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Bike, MapPin, UserCheck } from "lucide-react";
import styles from "./Admin.module.css";

const fmt = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

export default function RidersTab({ call, notify, onChange }) {
  const [riders, setRiders] = useState([]);
  const [deliveries, setDeliveries] = useState({
    orders: [],
    bookings: [],
    riders: [],
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [assignments, setAssignments] = useState({});
  const [payoutDrafts, setPayoutDrafts] = useState({});
  const [distanceDrafts, setDistanceDrafts] = useState({});

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const [r, d] = await Promise.all([
        call("/riders/admin"),
        call("/riders/admin/deliveries"),
      ]);

      setRiders(r);
      setDeliveries(d);
    } catch (e) {
      notify(`Could not load riders: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [call, notify]);

  useEffect(() => {
    load();
  }, [load]);

  const review = async (rider, status) => {
    try {
      await call(
        `/riders/admin/${encodeURIComponent(rider.riderId)}/status`,
        {
          method: "PATCH",
          body: { status },
        }
      );

      notify(`${rider.riderId}: ${status}`);

      await load();
      onChange();
    } catch (e) {
      notify(`Could not update rider: ${e.message}`);
    }
  };

  const assign = async (type, item) => {
    const id = type === "product" ? item.orderId : item.id;
    const key = `${type}-${id}`;
    const riderId =
      assignments[key] || item.riderId || item.delivery?.riderId;

    if (!riderId) {
      return notify("Choose an approved rider first");
    }

    const distanceKm = distanceDrafts[key];

    try {
      await call(
        `/riders/admin/assign/${type}/${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          body: {
            riderId,
            ...(distanceKm !== undefined && distanceKm !== ""
              ? { distanceKm: Number(distanceKm) }
              : {}),
          },
        }
      );

      notify(`${id} assigned to ${riderId}`);
      await load();
    } catch (e) {
      notify(`Could not assign delivery: ${e.message}`);
    }
  };

  const savePayout = async (rider) => {
    const draft = payoutDrafts[rider.riderId] || {
      payoutMode: rider.payoutMode || "fixed",
      fixedPayout: rider.fixedPayout ?? 40,
      payoutPerKm: rider.payoutPerKm ?? 8,
    };

    try {
      await call(
        `/riders/admin/${encodeURIComponent(rider.riderId)}/payout`,
        {
          method: "PATCH",
          body: {
            payoutMode: draft.payoutMode,
            fixedPayout: Number(draft.fixedPayout),
            payoutPerKm: Number(draft.payoutPerKm),
          },
        }
      );

      notify(`Payout settings saved for ${rider.riderId}`);
      await load();
    } catch (e) {
      notify(`Could not save payout: ${e.message}`);
    }
  };

  const filtered = riders.filter(
    (rider) => filter === "all" || rider.status === filter
  );

  const openJobs = [
    ...deliveries.orders.map((item) => ({
      ...item,
      type: "product",
      id: item.orderId,
      title: `Product order ${item.orderId}`,
      detail: item.address,
    })),
    ...deliveries.bookings.map((item) => ({
      ...item,
      type: "repair",
      title: `Repair booking ${item.id}`,
      detail: `${item.service} · ${item.address}`,
      id: item.id,
    })),
  ].filter(
    (item) =>
      !["delivered", "cancelled"].includes(item.status) &&
      !["delivered", "cancelled"].includes(item.delivery?.status)
  );

  return (
    <section>
      <div className={styles.toolbar}>
        <div className={styles.chips}>
          {["pending", "approved", "rejected", "suspended", "all"].map(
            (status) => (
              <button
                key={status}
                type="button"
                aria-pressed={filter === status}
                className={
                  filter === status
                    ? `${styles.chip} ${styles.on}`
                    : styles.chip
                }
                onClick={() => setFilter(status)}
              >
                {status[0].toUpperCase() + status.slice(1)}
              </button>
            )
          )}
        </div>

        <button className={styles.ghost} onClick={load}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {loading ? (
        <p className={styles.empty}>Loading riders…</p>
      ) : filtered.length ? (
        <ul className={styles.cards}>
          {filtered.map((rider) => {
            const payout = payoutDrafts[rider.riderId] || {};
            const payoutMode =
              payout.payoutMode ?? rider.payoutMode ?? "fixed";
            const fixedPayout =
              payout.fixedPayout ?? rider.fixedPayout ?? 40;
            const payoutPerKm =
              payout.payoutPerKm ?? rider.payoutPerKm ?? 8;

            return (
              <li className={styles.bcard} key={rider.riderId}>
                <div className={styles.bHead}>
                  <strong>
                    <Bike size={16} style={{ verticalAlign: "middle" }} />{" "}
                    {rider.name}
                  </strong>

                  <span
                    className={`${styles.badge} ${
                      styles[rider.status] || ""
                    }`}
                  >
                    {rider.status}
                  </span>
                </div>

                <p className={styles.bLine}>
                  Rider ID <strong>{rider.riderId}</strong> ·{" "}
                  {rider.vehicleType} · {rider.vehicleRegistration}
                </p>

                <p className={styles.bLine}>
                  Phone: {rider.phone} · Applied {fmt(rider.createdAt)}
                </p>

                <p className={styles.bLine}>
                  <MapPin size={13} />{" "}
                  {rider.serviceZones?.join(", ")}
                </p>

                <p className={styles.bLine}>
                  Documents:{" "}
                  <a
                    href={rider.documents?.drivingLicence}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Licence
                  </a>{" "}
                  ·{" "}
                  <a
                    href={rider.documents?.governmentId}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Government ID
                  </a>{" "}
                  ·{" "}
                  <a
                    href={rider.documents?.vehicleRegistration}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Vehicle
                  </a>
                </p>

                {rider.adminNote && (
                  <p className={styles.note}>{rider.adminNote}</p>
                )}

                <div className={styles.bActions}>
                  {rider.status === "approved" && (
                    <>
                      <select
                        aria-label={`Payout mode for ${rider.riderId}`}
                        value={payoutMode}
                        onChange={(e) =>
                          setPayoutDrafts((prev) => ({
                            ...prev,
                            [rider.riderId]: {
                              payoutMode: e.target.value,
                              fixedPayout:
                                prev[rider.riderId]?.fixedPayout ??
                                rider.fixedPayout ??
                                40,
                              payoutPerKm:
                                prev[rider.riderId]?.payoutPerKm ??
                                rider.payoutPerKm ??
                                8,
                            },
                          }))
                        }
                      >
                        <option value="fixed">Fixed payout</option>
                        <option value="distance">Distance-based</option>
                      </select>

                      <input
                        aria-label={`Fixed payout for ${rider.riderId}`}
                        type="number"
                        min="0"
                        value={fixedPayout}
                        placeholder="Fixed ₹"
                        onChange={(e) =>
                          setPayoutDrafts((prev) => ({
                            ...prev,
                            [rider.riderId]: {
                              payoutMode:
                                prev[rider.riderId]?.payoutMode ??
                                rider.payoutMode ??
                                "fixed",
                              fixedPayout: e.target.value,
                              payoutPerKm:
                                prev[rider.riderId]?.payoutPerKm ??
                                rider.payoutPerKm ??
                                8,
                            },
                          }))
                        }
                      />

                      <input
                        aria-label={`Per km payout for ${rider.riderId}`}
                        type="number"
                        min="0"
                        value={payoutPerKm}
                        placeholder="₹/km"
                        onChange={(e) =>
                          setPayoutDrafts((prev) => ({
                            ...prev,
                            [rider.riderId]: {
                              payoutMode:
                                prev[rider.riderId]?.payoutMode ??
                                rider.payoutMode ??
                                "fixed",
                              fixedPayout:
                                prev[rider.riderId]?.fixedPayout ??
                                rider.fixedPayout ??
                                40,
                              payoutPerKm: e.target.value,
                            },
                          }))
                        }
                      />

                      <button
                        className={styles.ghost}
                        onClick={() => savePayout(rider)}
                      >
                        Save payout
                      </button>
                    </>
                  )}

                  {rider.status !== "approved" && (
                    <button
                      className={styles.primary}
                      onClick={() => review(rider, "approved")}
                    >
                      <UserCheck size={14} /> Approve
                    </button>
                  )}

                  {rider.status !== "rejected" && (
                    <button
                      className={styles.ghost}
                      onClick={() => review(rider, "rejected")}
                    >
                      Reject
                    </button>
                  )}

                  {rider.status === "approved" && (
                    <button
                      className={styles.ghost}
                      onClick={() => review(rider, "suspended")}
                    >
                      Suspend
                    </button>
                  )}

                  {rider.status !== "pending" && (
                    <button
                      className={styles.ghost}
                      onClick={() => review(rider, "pending")}
                    >
                      Reset status
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className={styles.empty}>No riders in this group.</p>
      )}

      <div className={styles.toolbar} style={{ marginTop: 28 }}>
        <h2 style={{ margin: 0 }}>Active deliveries</h2>

        <button className={styles.ghost} onClick={load}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {openJobs.length ? (
        <ul className={styles.cards}>
          {openJobs.map((item) => {
            const key = `${item.type}-${item.id}`;

            return (
              <li className={styles.bcard} key={key}>
                <div className={styles.bHead}>
                  <strong>{item.title}</strong>

                  <span className={styles.badge}>
                    {item.status || item.delivery?.status || "open"}
                  </span>
                </div>

                <p className={styles.bLine}>{item.detail}</p>

                <p className={styles.bLine}>
                  {item.customerName || item.name} ·{" "}
                  {item.customerPhone || item.phone}
                </p>

                <div className={styles.bActions}>
                  <input
                    type="number"
                    min="0"
                    max="500"
                    step="0.1"
                    placeholder="Distance km (optional)"
                    aria-label={`Distance for ${item.id}`}
                    value={distanceDrafts[key] ?? ""}
                    onChange={(e) =>
                      setDistanceDrafts((prev) => ({
                        ...prev,
                        [key]: e.target.value,
                      }))
                    }
                  />

                  <select
                    aria-label={`Rider for ${item.id}`}
                    value={
                      assignments[key] ||
                      item.riderId ||
                      item.delivery?.riderId ||
                      ""
                    }
                    onChange={(e) =>
                      setAssignments((prev) => ({
                        ...prev,
                        [key]: e.target.value,
                      }))
                    }
                  >
                    <option value="">Choose approved rider</option>

                    {deliveries.riders.map((rider) => (
                      <option
                        key={rider.riderId}
                        value={rider.riderId}
                      >
                        {rider.riderId} · {rider.name}
                      </option>
                    ))}
                  </select>

                  <button
                    className={styles.primary}
                    onClick={() => assign(item.type, item)}
                  >
                    Assign / reassign
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className={styles.empty}>
          No active product orders or repair pickups.
        </p>
      )}
    </section>
  );
}
