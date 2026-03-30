import db from '../utils/db.js';

// Get all routes
export const getRoutes = async (req, res, next) => {
  try {
    let routes = await db.findAllRoutes();
    const vehicles = await db.findAllVehicles();

    const enriched = routes.map(r => {
      const vehicle = r.vehicleId
        ? vehicles.find(v => String(v.id) === String(r.vehicleId))
        : null;
      // Parse geometry from optimizedPath
      let geometry = null;
      if (r.optimizedPath) {
        try { geometry = JSON.parse(r.optimizedPath); } catch { geometry = null; }
      }
      return {
        ...r,
        distance: r.estimatedDistance ? Number(r.estimatedDistance) : null,
        duration: r.estimatedTime ? Number(r.estimatedTime) : null,
        geometry,
        vehicle: vehicle ? { id: vehicle.id, plateNumber: vehicle.plateNumber, make: vehicle.make, model: vehicle.model } : null
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
    const route = await db.createRoute(req.body);
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
