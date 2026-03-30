import db from '../utils/db.js';
import { adminRecipientFromTripBooking } from '../utils/notificationTargets.js';

/** Resolve driverId from JWT or by looking up user */
async function resolveDriverId(req) {
  let driverId = req.user?.driverId;
  if (!driverId && req.user?.id) {
    const user = await db.findUser({ id: req.user.id });
    if (user?.role === 'driver' && user?.driverId) driverId = user.driverId;
  }
  return driverId;
}

/**
 * Get driver profile and dashboard data
 */
export const getDriverProfile = async (req, res, next) => {
  try {
    const driverId = await resolveDriverId(req);
    if (!driverId) {
      return res.status(403).json({ error: 'Driver access required' });
    }

    const driver = await db.findDriverById(driverId);
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    // Find vehicle assigned to this driver via active trips
    const trips = await db.findAllTrips();
    const activeTrip = trips.find(t =>
      String(t.driverId) === String(driverId) &&
      (t.status === 'Pending' || t.status === 'In_Progress')
    );
    const vehicle = activeTrip?.vehicleId
      ? await db.findVehicleById(activeTrip.vehicleId)
      : null;

    res.json({
      ...driver,
      assignedVehicle: vehicle ? {
        id: vehicle.id,
        plateNumber: vehicle.plateNumber,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        fuelType: vehicle.fuelType,
        operationalStatus: vehicle.operationalStatus
      } : null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get trips for the logged-in driver
 */
export const getDriverTrips = async (req, res, next) => {
  try {
    const driverId = await resolveDriverId(req);
    if (!driverId) {
      return res.status(403).json({ error: 'Driver access required' });
    }

    const trips = await db.findAllTrips();
    const driverTrips = trips.filter(t => String(t.driverId) === String(driverId));
    const vehicles = await db.findAllVehicles();
    const routes = await db.findAllRoutes();
    const bookings = await db.findAllBookings();

    const enriched = driverTrips.map(trip => {
      const vehicle = vehicles.find(v => String(v.id) === String(trip.vehicleId));
      // Find matching route by origin/destination
      const tripOrigin = (trip.origin || 'UCU Main Campus').replace(/Uganda Christian University Main Campus/i, 'UCU Main Campus');
      const tripDest = (trip.destination || '').trim();
      const route = routes.find(r => {
        const rOrigin = (r.origin || '').replace(/Uganda Christian University Main Campus/i, 'UCU Main Campus');
        return rOrigin === tripOrigin && (r.destination || '').trim() === tripDest &&
          (!r.driverId || String(r.driverId) === String(driverId));
      }) || null;

      const booking = trip.bookingId ? bookings.find(b => String(b.id) === String(trip.bookingId)) : null;
      const purpose = booking?.purpose ?? null;

      // Parse route geometry from optimizedPath if stored as JSON string
      let geometry = null;
      if (route?.optimizedPath) {
        try { geometry = JSON.parse(route.optimizedPath); } catch { geometry = null; }
      }

      return {
        ...trip,
        purpose,
        vehicle: vehicle ? { plateNumber: vehicle.plateNumber, make: vehicle.make, model: vehicle.model } : null,
        vehicles: vehicle ? [{ id: vehicle.id, plateNumber: vehicle.plateNumber, make: vehicle.make, model: vehicle.model }] : [],
        route: route ? {
          distance: route.estimatedDistance ? Number(route.estimatedDistance) : null,
          duration: route.estimatedTime ? Number(route.estimatedTime) : null,
          origin: route.origin,
          destination: route.destination,
          geometry: geometry && geometry.length >= 2 ? geometry : null
        } : null
      };
    });

    res.json(enriched);
  } catch (error) {
    next(error);
  }
};

/**
 * Get routes assigned to the logged-in driver
 */
export const getDriverRoutes = async (req, res, next) => {
  try {
    const driverId = await resolveDriverId(req);
    if (!driverId) {
      return res.status(403).json({ error: 'Driver access required' });
    }

    const routes = (await db.findAllRoutes()) || [];
    const driverTrips = (await db.findAllTrips()) || [];
    const myTrips = driverTrips.filter(t => t && String(t.driverId) === String(driverId));

    const driverRoutes = routes.filter(r => {
      if (r.driverId && String(r.driverId) === String(driverId)) return true;
      // Include routes matching this driver's trip origin/destination
      if (myTrips.some(t => {
        const tOrigin = (t.origin || '').replace(/Uganda Christian University Main Campus/i, 'UCU Main Campus');
        const rOrigin = (r.origin || '').replace(/Uganda Christian University Main Campus/i, 'UCU Main Campus');
        return tOrigin === rOrigin && (t.destination || '').trim() === (r.destination || '').trim();
      })) return true;
      return false;
    });

    const vehicles = await db.findAllVehicles();
    const enriched = driverRoutes.map(route => {
      const vehicle = route.vehicleId
        ? vehicles.find(v => String(v.id) === String(route.vehicleId))
        : null;

      // Find matching trip for this route
      const rOrigin = (route.origin || '').replace(/Uganda Christian University Main Campus/i, 'UCU Main Campus');
      const rDest = (route.destination || '').trim();
      const matchedTrip = myTrips.find(t => {
        const tOrigin = (t.origin || 'UCU Main Campus').replace(/Uganda Christian University Main Campus/i, 'UCU Main Campus');
        return tOrigin === rOrigin && (t.destination || '').trim() === rDest;
      });

      // Parse geometry
      let geometry = null;
      if (route.optimizedPath) {
        try { geometry = JSON.parse(route.optimizedPath); } catch { geometry = null; }
      }

      return {
        ...route,
        tripId: matchedTrip?.id || null,
        distance: route.estimatedDistance ? Number(route.estimatedDistance) : null,
        duration: route.estimatedTime ? Number(route.estimatedTime) : null,
        geometry,
        vehicle: vehicle ? { id: vehicle.id, plateNumber: vehicle.plateNumber, make: vehicle.make, model: vehicle.model } : null
      };
    });

    res.json(enriched);
  } catch (error) {
    next(error);
  }
};

/**
 * Get fuel logs for driver's vehicle(s)
 */
export const getDriverFuelLogs = async (req, res, next) => {
  try {
    const driverId = await resolveDriverId(req);
    if (!driverId) {
      return res.status(403).json({ error: 'Driver access required' });
    }

    const driver = await db.findDriverById(driverId);
    if (!driver) return res.status(404).json({ error: 'Driver not found' });

    const allLogs = await db.findAllFuelLogs();
    const vehicles = await db.findAllVehicles();

    // Collect vehicle IDs from driver's trips
    const driverTrips = await db.findAllTrips();
    const driverVehicleIds = new Set();
    driverTrips.filter(t => String(t.driverId) === String(driverId)).forEach(t => {
      if (t.vehicleId) driverVehicleIds.add(String(t.vehicleId));
    });

    const logs = allLogs.filter(l => driverVehicleIds.has(String(l.vehicleId)));
    const enriched = logs.map(log => {
      const vehicle = vehicles.find(v => String(v.id) === String(log.vehicleId));
      return {
        ...log,
        vehicle: vehicle ? { plateNumber: vehicle.plateNumber, make: vehicle.make, model: vehicle.model } : null,
      };
    });

    res.json(enriched.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)));
  } catch (error) {
    next(error);
  }
};

/**
 * Create fuel log (driver) - only for assigned vehicle
 */
export const createDriverFuelLog = async (req, res, next) => {
  try {
    const driverId = await resolveDriverId(req);
    if (!driverId) {
      return res.status(403).json({ error: 'Driver access required' });
    }

    const driver = await db.findDriverById(driverId);
    if (!driver) return res.status(404).json({ error: 'Driver not found' });

    const { vehicleId, tripId, quantity, cost } = req.body || {};

    // Collect allowed vehicle IDs from driver's trips
    const driverTrips = await db.findAllTrips();
    const allowedVehicleIds = new Set();
    driverTrips.filter(t => String(t.driverId) === String(driverId)).forEach(t => {
      if (t.vehicleId) allowedVehicleIds.add(String(t.vehicleId));
    });

    if (!vehicleId || !allowedVehicleIds.has(String(vehicleId))) {
      return res.status(403).json({ error: 'You can only log fuel for your assigned vehicle(s)' });
    }
    if (!quantity || !cost) {
      return res.status(400).json({ error: 'Quantity and cost are required' });
    }

    const log = await db.createFuelLog({
      vehicleId,
      tripId: tripId || null,
      quantity: Number(quantity),
      cost: Number(cost),
      fuelType: req.body.fuelType || 'Diesel',
      odometerReading: req.body.odometerReading || 0,
      fuelStation: req.body.fuelStation || null,
      receiptNumber: req.body.receiptNumber || null,
      refuelDate: req.body.refuelDate || new Date(),
    });

    await db.createActivityLog({
      type: 'Fuel Logged',
      vehicleId,
      driverId,
      description: `Driver fuel log: ${quantity}L at ${cost} UGX`
    });

    res.status(201).json(log);
  } catch (error) {
    next(error);
  }
};

/**
 * Driver accept a trip
 */
export const acceptTrip = async (req, res, next) => {
  try {
    const driverId = await resolveDriverId(req);
    if (!driverId) return res.status(403).json({ error: 'Driver access required' });

    const tripId = req.params.id;
    const trip = await db.findTripById(tripId);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    if (String(trip.driverId) !== String(driverId)) return res.status(403).json({ error: 'You can only respond to trips assigned to you' });

    const feedback = req.body?.assignmentFeedback || req.body?.feedback || '';
    const updated = await db.updateTrip(tripId, {
      status: 'Pending',
      ...(feedback.trim() && { driverNotes: feedback.trim() })
    });

    await db.createNotification({
      type: 'trip_accepted',
      title: 'Driver Accepted Trip',
      message: `Driver accepted trip ${tripId}`,
      recipientRole: 'admin',
      driverId,
      ...(await adminRecipientFromTripBooking(trip))
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

/**
 * Driver reject a trip (reason required)
 */
export const rejectTrip = async (req, res, next) => {
  try {
    const driverId = await resolveDriverId(req);
    if (!driverId) return res.status(403).json({ error: 'Driver access required' });

    const tripId = req.params.id;
    const trip = await db.findTripById(tripId);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    if (String(trip.driverId) !== String(driverId)) return res.status(403).json({ error: 'You can only respond to trips assigned to you' });

    const reason = req.body?.declineReason || req.body?.reason || '';
    if (!reason || !String(reason).trim()) return res.status(400).json({ error: 'Decline reason is required' });

    const updated = await db.updateTrip(tripId, {
      status: 'Cancelled',
      driverNotes: `Declined: ${reason.trim()}`
    });

    await db.createNotification({
      type: 'trip_declined',
      title: 'Driver Declined Trip',
      message: `Driver declined trip ${tripId}. Reason: ${reason.trim()}`,
      recipientRole: 'admin',
      driverId,
      ...(await adminRecipientFromTripBooking(trip))
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

/**
 * Driver report incident - only for vehicle from their trips
 */
export const createDriverIncident = async (req, res, next) => {
  try {
    const driverId = await resolveDriverId(req);
    if (!driverId) return res.status(403).json({ error: 'Driver access required' });

    const driver = await db.findDriverById(driverId);
    if (!driver) return res.status(404).json({ error: 'Driver not found' });

    const { vehicleId, incidentType, severity, location, description } = req.body || {};
    if (!vehicleId || !description?.trim()) {
      return res.status(400).json({ error: 'Vehicle and description are required' });
    }

    // Collect allowed vehicle IDs from driver's trips
    const driverTrips = (await db.findAllTrips()) || [];
    const allowedVehicleIds = new Set();
    driverTrips.filter(t => String(t.driverId) === String(driverId)).forEach(t => {
      if (t.vehicleId) allowedVehicleIds.add(String(t.vehicleId));
    });

    if (!allowedVehicleIds.has(String(vehicleId))) {
      return res.status(403).json({ error: 'You can only report incidents for your assigned vehicle(s)' });
    }

    // Validate and normalize incidentType enum
    const validTypes = ['Accident', 'Breakdown', 'Theft', 'Vandalism', 'Minor_Damage', 'Other'];
    const typeMap = { 'Minor Damage': 'Minor_Damage', 'Vehicle Damage': 'Other' };
    const normalizedType = typeMap[incidentType] || (validTypes.includes(incidentType) ? incidentType : 'Other');

    // Validate severity enum
    const validSeverities = ['Low', 'Medium', 'High', 'Critical'];
    const normalizedSeverity = validSeverities.includes(severity) ? severity : 'Medium';

    const incident = await db.createIncident({
      vehicleId,
      driverId,
      incidentType: normalizedType,
      severity: normalizedSeverity,
      location: location || '',
      description: description.trim(),
      status: 'Reported',
      reportedBy: req.user?.id,
    });

    await db.createActivityLog({
      type: 'Incident Reported',
      vehicleId,
      driverId,
      description: `Driver reported incident: ${normalizedType} - ${description.trim().slice(0, 50)}`
    });

    await db.createNotification({
      type: 'incident_reported',
      title: 'New Incident Reported by Driver',
      message: `Driver ${driver.name} reported ${normalizedType}: ${description.trim().slice(0, 80)}${description.length > 80 ? '...' : ''}`,
      recipientRole: 'admin',
      driverId,
    });

    res.status(201).json(incident);
  } catch (error) {
    next(error);
  }
};

/**
 * Get incidents reported by this driver
 */
export const getDriverIncidents = async (req, res, next) => {
  try {
    const driverId = await resolveDriverId(req);
    if (!driverId) return res.status(403).json({ error: 'Driver access required' });

    const incidents = (await db.findAllIncidents()) || [];
    const driverIncidents = incidents.filter(i => String(i.driverId) === String(driverId));
    res.json(driverIncidents);
  } catch (error) {
    next(error);
  }
};
