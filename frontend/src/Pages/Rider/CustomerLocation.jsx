// src/Pages/Rider/CustomerLocation.jsx
// Shown inside each accepted delivery on the Rider portal:
//   - "Show map"  : where the customer is (only when the customer shared a location at checkout)
//   - "Navigate"  : opens Google Maps with directions (or searches the address if there is no pin)
//   - "Locate me" : shows the rider's own position on the map (stays in this browser, not sent anywhere)
import { lazy, Suspense, useState } from "react";
import { MapPin, Navigation, LocateFixed } from "lucide-react";
import styles from "./CustomerLocation.module.css";

// the map code is downloaded only when a rider opens a map
const DeliveryMap = lazy(() => import("./DeliveryMap.jsx"));

const toPoint = (p) => {
  const lat = Number(p?.lat);
  const lng = Number(p?.lng);
  return p && Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
};

// straight-line distance in km (not the road distance)
function kmBetween(a, b) {
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export default function CustomerLocation({ item }) {
  const [open, setOpen] = useState(false);
  const [me, setMe] = useState(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState("");

  const status = item.type === "product" ? item.status : item.delivery?.status;
  if (status === "delivered" || status === "cancelled") return null;

  const customer = toPoint(item.destination);
  const saved = toPoint(item.type === "product" ? item.riderLocation : item.delivery?.riderLocation);
  const rider = me || saved;
  const address = (item.address || "").trim();

  const navUrl = customer
    ? `https://www.google.com/maps/dir/?api=1&destination=${customer.lat},${customer.lng}&travelmode=driving`
    : address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
      : "";

  const locateMe = () => {
    if (!navigator.geolocation) return setGeoError("Location is not supported by this browser.");
    setLocating(true);
    setGeoError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMe({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setGeoError("Location permission was not granted.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className={styles.box}>
      <div className={styles.buttons}>
        {customer ? (
          <button
            type="button"
            className={styles.btn}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            <MapPin size={15} aria-hidden="true" /> {open ? "Hide map" : "Show map"}
          </button>
        ) : null}
        {navUrl ? (
          <a className={`${styles.btn} ${styles.navigate}`} href={navUrl} target="_blank" rel="noopener noreferrer">
            <Navigation size={15} aria-hidden="true" /> {customer ? "Navigate" : "Find address in Maps"}
          </a>
        ) : null}
      </div>

      {!customer ? (
        <p className={styles.note}>The customer did not share an exact location, so there is no map pin. Use the address above.</p>
      ) : null}

      {customer && open ? (
        <>
          <Suspense fallback={<p className={styles.note}>Loading map…</p>}>
            <DeliveryMap customer={customer} rider={rider} />
          </Suspense>
          <div className={styles.under}>
            <button type="button" className={styles.btn} onClick={locateMe} disabled={locating}>
              <LocateFixed size={15} aria-hidden="true" /> {locating ? "Locating…" : "Show my position"}
            </button>
            {rider ? <span className={styles.dist}>≈ {kmBetween(rider, customer).toFixed(1)} km straight line</span> : null}
          </div>
          {geoError ? <p className={styles.error} role="alert">{geoError}</p> : null}
        </>
      ) : null}
    </div>
  );
}