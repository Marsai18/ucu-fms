import db from '../utils/db.js';

// Get all trips
export const getTrips = async (req, res, next) => {
  try {
    const trips = await db.findAllTrips();
    res.json(trips);
  } catch (error) {
    next(error);
  }
};

// Get trip by ID
export const getTripById = async (req, res, next) => {
  try {
    const trip = await db.findTripById(req.params.id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    res.json(trip);
  } catch (error) {
    next(error);
  }
};

// Create trip
export const createTrip = async (req, res, next) => {
  try {
    const trip = await db.createTrip(req.body);
    res.status(201).json(trip);
  } catch (error) {
    next(error);
  }
};

// Update trip (start, update odometer, complete)
export const updateTrip = async (req, res, next) => {
  try {
    const updates = { ...req.body };
    
    if (updates.endOdometer !== undefined) {
      const currentTrip = await db.findTripById(req.params.id);
      if (currentTrip?.startOdometer) {
        updates.distanceTraveled = updates.endOdometer - currentTrip.startOdometer;
      }
    }

    if (updates.status === 'In Progress' && !updates.departureTime) {
      updates.departureTime = new Date().toISOString();
    }

    const trip = await db.updateTrip(req.params.id, updates);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    if (trip.status === 'Completed') {
      await db.createActivityLog({
        type: 'Trip Completed',
        vehicleId: trip.vehicleId,
        driverId: trip.driverId,
        description: `Trip ${trip.id} completed`
      });
    }

    res.json(trip);
  } catch (error) {
    next(error);
  }
};
