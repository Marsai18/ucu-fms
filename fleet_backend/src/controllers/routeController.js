import db from '../utils/db.js';

// Get all routes (optionally filter saved-only: ?saved=true, exclude suspended: ?excludeSuspended=true)
export const getRoutes = async (req, res, next) => {
  try {
    let routes = await db.findAllRoutes();
    if (req.query.saved === 'true') {
      routes = routes.filter(r => !r.tripId);
    }
    if (req.query.excludeSuspended === 'true') {
      routes = routes.filter(r => !r.suspended);
    }
    const vehicles = await db.findAllVehicles();
    const enriched = routes.map(r => {
      const vehicle = r.preferredVehicle
        ? vehicles.find(v => String(v.id) === String(r.preferredVehicle))
        : null;
      return {
        ...r,
        vehicle: vehicle ? { id: vehicle.id, plateNumber: vehicle.plateNumber, make: vehicle.make, model: vehicle.model, vehicleType: vehicle.vehicleType } : null
      };
    });
    res.json(enriched);
  } catch (error) {
    next(error);
  }
};

// Create route
export const createRoute = async (req, res, next) => {
  try {
    const body = { ...req.body };
    if (body.preferredVehicle && !body.driverId) {
      const drivers = await db.findAllDrivers();
      const driver = drivers.find(d => String(d.assignedVehicle) === String(body.preferredVehicle));
      if (driver) body.driverId = driver.id;
    }
    const route = await db.createRoute(body);
    res.status(201).json(route);
  } catch (error) {
    next(error);
  }
};

// Update route
export const updateRoute = async (req, res, next) => {
  try {
    const route = await db.updateRoute(req.params.id, req.body);
    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }
    res.json(route);
  } catch (error) {
    next(error);
  }
};
