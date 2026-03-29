import db from './db.js';

/** Admin who approved the booking — used to scope feedback / trip events to that admin. */
export async function adminRecipientFromTripBooking(trip) {
  if (!trip?.bookingId) return {};
  const booking = await db.findBookingById(trip.bookingId);
  const uid = booking?.approvedByUserId;
  if (uid == null || String(uid).trim() === '') return {};
  return { recipientUserId: String(uid) };
}
