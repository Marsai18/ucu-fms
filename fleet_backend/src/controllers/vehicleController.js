import db from '../utils/db.js';

// Get all vehicles
export const getVehicles = async (req, res, next) => {
  try {
    const vehicles = await db.findAllVehicles();
    res.json(vehicles);
  } catch (error) {
    next(error);
  }
};

// Get vehicle by ID
export const getVehicleById = async (req, res, next) => {
  try {
    const vehicle = await db.findVehicleById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    res.json(vehicle);
  } catch (error) {
    next(error);
  }
};

// Create vehicle acquisition (status defaults to Available until assigned)
export const createVehicleAcquisition = async (req, res, next) => {
  try {
    const vehicle = await db.createVehicle({
      ...req.body,
      operationalStatus: req.body.operationalStatus || 'Available'
    });
    res.status(201).json(vehicle);
  } catch (error) {
    next(error);
  }
};

// Create vehicle
export const createVehicle = async (req, res, next) => {
  try {
    const vehicle = await db.createVehicle(req.body);
    await db.createActivityLog({
      type: 'Vehicle Registered',
      vehicleId: vehicle.id,
      description: `Vehicle ${vehicle.plateNumber || vehicle.id} registered`
    });
    res.status(201).json(vehicle);
  } catch (error) {
    next(error);
  }
};

// Update vehicle
export const updateVehicle = async (req, res, next) => {
  try {
    const vehicle = await db.updateVehicle(req.params.id, req.body);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    res.json(vehicle);
  } catch (error) {
    next(error);
  }
};

// Delete vehicle
export const deleteVehicle = async (req, res, next) => {
  try {
    const deleted = await db.deleteVehicle(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    next(error);
  }
};
