/** Latest timestamp from first defined key (ISO strings). */
export function maxDateMs(obj, keys) {
  let max = 0;
  for (const k of keys) {
    const v = obj?.[k];
    if (v == null || v === '') continue;
    const t = new Date(v).getTime();
    if (!Number.isNaN(t) && t > max) max = t;
  }
  return max;
}

export function sortBookingsByRecencyDesc(bookings) {
  if (!Array.isArray(bookings)) return [];
  return [...bookings].sort(
    (a, b) =>
      maxDateMs(b, ['updatedAt', 'createdAt', 'startDateTime']) -
      maxDateMs(a, ['updatedAt', 'createdAt', 'startDateTime'])
  );
}

export function sortTripsByRecencyDesc(trips) {
  if (!Array.isArray(trips)) return [];
  return [...trips].sort(
    (a, b) =>
      maxDateMs(b, ['updatedAt', 'createdAt', 'scheduledDeparture']) -
      maxDateMs(a, ['updatedAt', 'createdAt', 'scheduledDeparture'])
  );
}

export function sortNotificationsByRecencyDesc(list) {
  if (!Array.isArray(list)) return [];
  return [...list].sort((a, b) => maxDateMs(b, ['createdAt']) - maxDateMs(a, ['createdAt']));
}

export function sortRoutesByRecencyDesc(routes) {
  if (!Array.isArray(routes)) return [];
  return [...routes].sort(
    (a, b) => maxDateMs(b, ['updatedAt', 'createdAt']) - maxDateMs(a, ['updatedAt', 'createdAt'])
  );
}
