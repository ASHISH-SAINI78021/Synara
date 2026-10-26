// src/Pages/Rider/DeliveryMap.jsx
// The actual map (Leaflet + OpenStreetMap). It is loaded on demand by CustomerLocation.jsx,
// so the rest of the shop never downloads the map code.
import { useEffect, useMemo } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import styles from "./DeliveryMap.module.css";

// pin drawn with SVG, so no image files are needed
const pinSvg = (cls) =>
  `<svg class="${cls}" viewBox="0 0 24 30" width="30" height="36" aria-hidden="true">` +
  `<path d="M12 1C6.5 1 2 5.4 2 10.9 2 18.3 12 29 12 29s10-10.7 10-18.1C22 5.4 17.5 1 12 1z" class="${styles.pinBody}"/>` +
  `<circle cx="12" cy="11" r="4" class="${styles.pinDot}"/></svg>`;

const makeIcon = (cls) =>
  L.divIcon({ className: styles.pinWrap, html: pinSvg(cls), iconSize: [30, 36], iconAnchor: [15, 34], popupAnchor: [0, -30] });

const customerIcon = makeIcon(styles.customerPin);
const riderIcon = makeIcon(styles.riderPin);

// zoom the map so both pins are visible
function Fit({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 1) map.fitBounds(L.latLngBounds(points), { padding: [32, 32], maxZoom: 16 });
    else if (points.length === 1) map.setView(points[0], 16);
  }, [map, points]);
  return null;
}

export default function DeliveryMap({ customer, rider }) {
  const customerPoint = useMemo(() => [customer.lat, customer.lng], [customer.lat, customer.lng]);
  const riderLat = rider?.lat;
  const riderLng = rider?.lng;
  const riderPoint = useMemo(
    () => (Number.isFinite(riderLat) && Number.isFinite(riderLng) ? [riderLat, riderLng] : null),
    [riderLat, riderLng]
  );
  const points = useMemo(() => (riderPoint ? [customerPoint, riderPoint] : [customerPoint]), [customerPoint, riderPoint]);

  return (
    <div className={styles.wrap}>
      <MapContainer
        center={customerPoint}
        zoom={15}
        scrollWheelZoom={false}
        dragging={!L.Browser.mobile} // on phones one finger scrolls the page; pinch still zooms
        className={styles.map}
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={19}
        />
        <Marker position={customerPoint} icon={customerIcon}>
          <Popup>Customer</Popup>
        </Marker>
        {riderPoint ? (
          <Marker position={riderPoint} icon={riderIcon}>
            <Popup>You</Popup>
          </Marker>
        ) : null}
        <Fit points={points} />
      </MapContainer>
    </div>
  );
}