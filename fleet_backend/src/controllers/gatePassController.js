import crypto from 'crypto';
import db from '../utils/db.js';

const generateToken = () => crypto.randomBytes(18).toString('hex');

const resolveClientForBooking = async (booking) => {
  if (!booking?.userId) return null;
  const client = await db.findUser({ id: String(booking.userId) });
  if (!client) return null;
  return {
    id: String(client.id),
    name: client.name || client.username || null,
    email: client.email || null,
    username: client.username || null,
  };
};

const resolveDriverForTrip = async (trip) => {
  if (!trip?.driverId) return null;
  const driver = await db.findDriverById(trip.driverId);
  if (!driver) return null;
  return {
    id: String(driver.id),
    name: driver.name || null,
    email: driver.email || null,
    phone: driver.phone || null,
  };
};

const resolveRouteForTrip = (trip, route) => {
  // Parse geometry from route's optimizedPath (stored as JSON string)
  let geometry = null;
  if (route?.optimizedPath) {
    try { geometry = JSON.parse(route.optimizedPath); } catch { geometry = null; }
  }
  return {
    distanceKm: route?.estimatedDistance ? Number(route.estimatedDistance) : null,
    durationMin: route?.estimatedTime ? Number(route.estimatedTime) : null,
    origin: route?.origin ?? trip?.origin ?? null,
    destination: route?.destination ?? trip?.destination ?? null,
    geometry,
  };
};

const resolveTripLabel = (trip) => `TR-${trip?.id || ''}`.trim();

/**
 * Admin: create (or re-use unused) gate pass for a given trip.
 * One QR token is scannable once (after first scan, usedAt is set).
 */
export const createGatePass = async (req, res, next) => {
  try {
    const { tripId } = req.body || {};
    if (!tripId) return res.status(400).json({ error: 'tripId is required' });

    const trip = await db.findTripById(String(tripId));
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    if (!trip.driverId) return res.status(400).json({ error: 'Trip has no driver assigned yet' });

    const existingUnused = await db.findUnusedGatePassForTrip(String(trip.id));
    if (existingUnused) {
      return res.json(existingUnused);
    }

    const [driver, booking, routes] = await Promise.all([
      resolveDriverForTrip(trip),
      trip.bookingId ? db.findBookingById(String(trip.bookingId)) : Promise.resolve(null),
      db.findAllRoutes(),
    ]);

    // Find matching route by origin/destination since Route has no tripId field
    const tripOrigin = (trip.origin || '').replace(/Uganda Christian University Main Campus/i, 'UCU Main Campus');
    const tripDest = (trip.destination || '').trim();
    const route = (routes || []).find((r) => {
      const rOrigin = (r.origin || '').replace(/Uganda Christian University Main Campus/i, 'UCU Main Campus');
      return rOrigin === tripOrigin && (r.destination || '').trim() === tripDest &&
        (!r.vehicleId || String(r.vehicleId) === String(trip.vehicleId));
    }) || null;
    const client = await resolveClientForBooking(booking);

    const passengers = booking?.passengers ?? null;

    const token = generateToken();

    const gatePass = {
      token,
      tripId: String(trip.id),
      bookingId: trip.bookingId ? String(trip.bookingId) : null,
      driverId: String(trip.driverId),
      driver: driver || null,
      client: client || null,
      passengers: passengers != null ? Number(passengers) : null,
      trip: {
        id: String(trip.id),
        label: resolveTripLabel(trip),
        origin: trip.origin || route?.origin || null,
        destination: trip.destination || route?.destination || null,
      },
      route: resolveRouteForTrip(trip, route),
      issuedAt: new Date().toISOString(),
      usedAt: null,
      scannedAt: null,
    };

    const created = await db.createGatePass(gatePass);
    return res.status(201).json(created);
  } catch (error) {
    next(error);
  }
};

/**
 * Driver: list their gate passes (used + unused).
 */
export const getDriverGatePasses = async (req, res, next) => {
  try {
    const driverId = req.user?.driverId;
    if (!driverId) return res.status(403).json({ error: 'Driver access required' });

    const all = await db.findAllGatePasses();
    const mine = (all || [])
      .filter((g) => g && String(g.driverId) === String(driverId))
      .sort((a, b) => new Date(b.issuedAt || 0) - new Date(a.issuedAt || 0));

    return res.json(mine);
  } catch (error) {
    next(error);
  }
};

/**
 * Public: validate a gate pass scan and mark it as used (only once).
 */
export const scanGatePass = async (req, res, next) => {
  try {
    const { token } = req.body || {};
    if (!token) return res.status(400).json({ error: 'token is required' });

    const gatePass = await db.scanGatePass(String(token));
    if (!gatePass) return res.status(404).json({ error: 'Invalid gate pass token' });

    const used = !!gatePass.usedAt;
    return res.json({
      valid: !used,
      used,
      gatePass,
    });
  } catch (error) {
    next(error);
  }
};

