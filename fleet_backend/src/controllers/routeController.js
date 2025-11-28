import db from '../utils/db.js';

// Get all routes
export const getRoutes = async (req, res, next) => {
  try {
    const routes = await db.findAllRoutes();
    res.json(routes);
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
