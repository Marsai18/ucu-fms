import db from '../utils/db.js';
import { adminRecipientFromTripBooking } from '../utils/notificationTargets.js';

/** Resolve driverId from JWT or by looking up user (for tokens issued before driverId was in JWT) */
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
 * Requires: req.user.driverId (from JWT) or driver user lookup
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

    const vehicles = await db.findAllVehicles();
    const vehicle = driver.assignedVehicle
      ? vehicles.find(v => v.id === String(driver.assignedVehicle))
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
        vehicleType: vehicle.vehicleType,
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
      const vehicle = vehicles.find(v => v.id === String(trip.vehicleId));
      const vehicleList = (trip.vehicleIds || (trip.vehicleId ? [trip.vehicleId] : [])).map(vid => {
        const v = vehicles.find(x => x.id === String(vid));
        return v ? { id: v.id, plateNumber: v.plateNumber, make: v.make, model: v.model } : null;
      }).filter(Boolean);
      let route = routes.find(r => String(r.tripId) === String(trip.id));
      if (!route) {
        const tripOrigin = (trip.origin || 'UCU Main Campus').replace(/Uganda Christian University Main Campus/i, 'UCU Main Campus');
        const tripDest = (trip.destination || '').trim();
        route = routes.find(r => {
          const rOrigin = (r.origin || '').replace(/Uganda Christian University Main Campus/i, 'UCU Main Campus');
          return rOrigin === tripOrigin && (r.destination || '').trim() === tripDest;
        });
      }
      const routeGeometry = route?.geometry || trip.routeGeometry;
      const booking = trip.bookingId ? bookings.find(b => String(b.id) === String(trip.bookingId)) : null;
      const purpose = trip.purpose ?? booking?.purpose ?? null;
      const waypoints = trip.waypoints ?? booking?.waypoints ?? route?.waypoints ?? null;
      return {
        ...trip,
        purpose,
        waypoints,
        vehicle: vehicle ? { plateNumber: vehicle.plateNumber, make: vehicle.make, model: vehicle.model } : null,
        vehicles: vehicleList.length ? vehicleList : (vehicle ? [vehicle] : []),
        route: route || trip.routeDistance || trip.routeGeometry ? {
          distance: route?.distance ?? trip.routeDistance,
          duration: route?.duration ?? trip.routeDuration,
          origin: route?.origin ?? trip.origin,
          destination: route?.destination ?? trip.destination,
          waypoints: route?.waypoints ?? waypoints,
          geometry: routeGeometry && routeGeometry.length >= 2 ? routeGeometry : null
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

    const driver = await db.findDriverById(driverId);
    const routes = (await db.findAllRoutes()) || [];
    const driverTrips = (await db.findAllTrips()) || [];
    const myTrips = driverTrips.filter(t => t && String(t.driverId) === String(driverId));
    const driverRoutes = routes.filter(r => {
      if (r.driverId && String(r.driverId) === String(driverId)) return true;
      if (driver?.assignedVehicle && r.preferredVehicle && String(r.preferredVehicle) === String(driver.assignedVehicle)) return true;
      // Include routes whose trip is assigned to this driver
      if (r.tripId && myTrips.some(t => String(t.id) === String(r.tripId))) return true;
      return false;
    });
    const vehicles = await db.findAllVehicles();

    const enriched = driverRoutes.map(route => {
      const vehicle = route.preferredVehicle
        ? vehicles.find(v => v.id === String(route.preferredVehicle))
        : null;
      let tripId = route.tripId;
      if (!tripId) {
        const rOrigin = (route.origin || '').replace(/Uganda Christian University Main Campus/i, 'UCU Main Campus');
        const rDest = (route.destination || '').trim();
        const match = myTrips.find(t => {
          const tOrigin = (t.origin || 'UCU Main Campus').replace(/Uganda Christian University Main Campus/i, 'UCU Main Campus');
          return tOrigin === rOrigin && (t.destination || '').trim() === rDest;
        });
        if (match) tripId = match.id;
      }
      return {
        ...route,
        tripId: tripId || route.tripId,
        vehicle: vehicle ? { id: vehicle.id, plateNumber: vehicle.plateNumber, make: vehicle.make, model: vehicle.model, vehicleType: vehicle.vehicleType } : null
      };
    });

    res.json(enriched);
  } catch (error) {
    next(error);
  }
};

/**
 * Get fuel logs for driver's assigned vehicle(s)
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
    const routes = await db.findAllRoutes();

    const driverVehicleIds = new Set();
    if (driver.assignedVehicle) driverVehicleIds.add(String(driver.assignedVehicle));
    const driverTrips = await db.findAllTrips();
    driverTrips.filter(t => String(t.driverId) === String(driverId)).forEach(t => {
      (t.vehicleIds || (t.vehicleId ? [t.vehicleId] : [])).forEach(vid => driverVehicleIds.add(String(vid)));
    });

    const logs = allLogs.filter(l => driverVehicleIds.has(String(l.vehicleId)));
    const enriched = logs.map(log => {
      const vehicle = vehicles.find(v => v.id === String(log.vehicleId));
      const route = log.routeId ? routes.find(r => r.id === String(log.routeId)) : null;
      return {
        ...log,
        vehicle: vehicle ? { plateNumber: vehicle.plateNumber, make: vehicle.make, model: vehicle.model } : null,
        route: route ? { origin: route.origin, destination: route.destination, distance: route.distance } : null
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

    const { vehicleId, routeId, tripId, quantity, distanceCovered, cost, notes } = req.body || {};
    const allowedVehicleIds = new Set();
    if (driver.assignedVehicle) allowedVehicleIds.add(String(driver.assignedVehicle));
    const driverTrips = await db.findAllTrips();
    driverTrips.filter(t => String(t.driverId) === String(driverId)).forEach(t => {
      (t.vehicleIds || (t.vehicleId ? [t.vehicleId] : [])).forEach(vid => allowedVehicleIds.add(String(vid)));
    });

    if (!vehicleId || !allowedVehicleIds.has(String(vehicleId))) {
      return res.status(403).json({ error: 'You can only log fuel for your assigned vehicle(s)' });
    }
    if (!quantity || !cost) {
      return res.status(400).json({ error: 'Quantity and cost are required' });
    }

    const log = await db.createFuelLog({
      vehicleId,
      routeId: routeId || null,
      tripId: tripId || null,
      quantity: Number(quantity),
      distanceCovered: distanceCovered != null ? Number(distanceCovered) : null,
      cost: Number(cost),
      notes: notes || '',
      recordedBy: driver.name || `Driver ${driverId}`,
      driverId
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
    if (trip.driverResponse && trip.driverResponse !== 'pending') return res.status(400).json({ error: 'Trip already responded to' });

    const feedback = req.body?.assignmentFeedback || req.body?.feedback || '';
    const updated = await db.updateTrip(tripId, {
      driverResponse: 'accepted',
      ...(feedback.trim() && { assignmentFeedback: feedback.trim() })
    });

    await db.createNotification({
      type: 'trip_accepted',
      title: 'Driver Accepted Trip',
      message: `Driver accepted trip ${trip.tripCode || tripId}`,
      tripId,
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
    if (trip.driverResponse && trip.driverResponse !== 'pending') return res.status(400).json({ error: 'Trip already responded to' });

    const reason = req.body?.declineReason || req.body?.reason || '';
    if (!reason || !String(reason).trim()) return res.status(400).json({ error: 'Decline reason is required' });

    const updated = await db.updateTrip(tripId, {
      driverResponse: 'declined',
      declineReason: reason.trim(),
      status: 'Cancelled'
    });

    await db.createNotification({
      type: 'trip_declined',
      title: 'Driver Declined Trip',
      message: `Driver declined trip ${trip.tripCode || tripId}. Reason: ${reason.trim()}`,
      tripId,
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
 * Driver report incident - only for assigned vehicle
 */
export const createDriverIncident = async (req, res, next) => {
  try {
    const driverId = await resolveDriverId(req);
    if (!driverId) return res.status(403).json({ error: 'Driver access required' });

    const driver = await db.findDriverById(driverId);
    if (!driver) return res.status(404).json({ error: 'Driver not found' });

    const { vehicleId, incidentType, severity, location, description, evidenceFile, evidenceFileName } = req.body || {};
    if (!vehicleId || !description?.trim()) {
      return res.status(400).json({ error: 'Vehicle and description are required' });
    }

    const allowedVehicleIds = new Set();
    if (driver.assignedVehicle) allowedVehicleIds.add(String(driver.assignedVehicle));
    const driverTrips = (await db.findAllTrips()) || [];
    driverTrips.filter(t => String(t.driverId) === String(driverId)).forEach(t => {
      (t.vehicleIds || (t.vehicleId ? [t.vehicleId] : [])).forEach(vid => allowedVehicleIds.add(String(vid)));
    });

    if (!allowedVehicleIds.has(String(vehicleId))) {
      return res.status(403).json({ error: 'You can only report incidents for your assigned vehicle(s)' });
    }

    const incident = await db.createIncident({
      vehicleId,
      driverId,
      incidentType: incidentType || 'Vehicle Damage',
      severity: severity || 'Medium',
      location: location || '',
      description: description.trim(),
      status: 'Reported',
      reportedBy: req.user?.id,
      reportedByDriver: true,
      ...(evidenceFile && { evidenceFile, evidenceFileName: evidenceFileName || 'evidence' })
    });

    await db.createActivityLog({
      type: 'Incident Reported',
      vehicleId,
      driverId,
      description: `Driver reported incident: ${incidentType || 'Reported'} - ${description.trim().slice(0, 50)}...`
    });

    await db.createNotification({
      type: 'incident_reported',
      title: evidenceFile ? '⚠️ New Incident + Evidence from Driver' : '⚠️ New Incident Reported by Driver',
      message: evidenceFile
        ? `Driver ${driver.name} reported ${incidentType || 'an incident'} with evidence attached: ${description.trim().slice(0, 60)}${description.length > 60 ? '...' : ''}`
        : `Driver ${driver.name} reported ${incidentType || 'an incident'}: ${description.trim().slice(0, 80)}${description.length > 80 ? '...' : ''}`,
      incidentId: incident.id,
      recipientRole: 'admin',
      driverId,
      severity: severity || 'Medium'
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
