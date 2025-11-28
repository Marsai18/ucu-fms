import db from '../utils/db.js';

// Get all drivers
export const getDrivers = async (req, res, next) => {
  try {
    const drivers = await db.findAllDrivers();
    res.json(drivers);
  } catch (error) {
    next(error);
  }
};

// Get driver by ID
export const getDriverById = async (req, res, next) => {
  try {
    const driver = await db.findDriverById(req.params.id);
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    res.json(driver);
  } catch (error) {
    next(error);
  }
};

// Create driver
export const createDriver = async (req, res, next) => {
  try {
    const driver = await db.createDriver(req.body);
    res.status(201).json(driver);
  } catch (error) {
    next(error);
  }
};

// Update driver
export const updateDriver = async (req, res, next) => {
  try {
    const driver = await db.updateDriver(req.params.id, req.body);
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    res.json(driver);
  } catch (error) {
    next(error);
  }
};

// Delete driver
export const deleteDriver = async (req, res, next) => {
  try {
    const deleted = await db.deleteDriver(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

// Get training sessions
export const getTrainingSessions = async (req, res, next) => {
  try {
    // Return empty array for now - can be extended
    res.json([]);
  } catch (error) {
    next(error);
  }
};

// Create training session
export const createTrainingSession = async (req, res, next) => {
  try {
    res.status(201).json({ message: 'Training session created', ...req.body });
  } catch (error) {
    next(error);
  }
};

// Get driver performance
export const getDriverPerformance = async (req, res, next) => {
  try {
    res.json([]);
  } catch (error) {
    next(error);
  }
};
