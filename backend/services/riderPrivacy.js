// services/riderPrivacy.js
// What a rider may see about a delivery BEFORE accepting it.
// It is a whitelist: only the fields written here are ever sent. Everything else
// (customer name, phone, full address, map position, notes, user id...) stays on the server
// until the rider accepts the delivery and it appears in "My deliveries".

// orderRecord: an order from MongoDB. distanceFromYouKm: rough distance, or null if unknown.
export function publicOpenOrder(orderRecord, distanceFromYouKm = null) {
  return {
    type: "product",
    orderId: orderRecord.orderId,
    area: orderRecord.zone || "",
    itemCount: Array.isArray(orderRecord.items) ? orderRecord.items.length : 0,
    total: orderRecord.total,
    paymentMethod: orderRecord.paymentMethod,
    distanceFromYouKm,
    createdAt: orderRecord.createdAt,
  };
}

// bookingRecord: a repair booking from MongoDB.
export function publicOpenBooking(bookingRecord) {
  return {
    type: "repair",
    id: bookingRecord.id,
    service: bookingRecord.service,
    device: bookingRecord.device,
    mode: bookingRecord.mode,
    dateLabel: bookingRecord.dateLabel,
    slot: bookingRecord.slot,
    price: bookingRecord.price,
    area: bookingRecord.delivery?.zone || "",
    delivery: { status: bookingRecord.delivery?.status || "open" },
    createdAt: bookingRecord.createdAt,
  };
}