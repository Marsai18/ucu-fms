import db from '../utils/db.js';
import prisma from '../config/database.js';

// Admin CRUD for drivers

export const getDrivers = async (req, res, next) => {
  try {
    const drivers = await db.findAllDrivers();
    res.json(drivers);
  } catch (error) {
    next(error);
  }
};

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

export const createDriver = async (req, res, next) => {
  try {
    const driver = await db.createDriver(req.body);
    res.status(201).json(driver);
  } catch (error) {
    next(error);
  }
};

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

export const deleteDriver = async (req, res, next) => {
  try {
    const deleted = await db.deleteDriver(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    res.json({ message: 'Driver deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getTrainingSessions = async (req, res, next) => {
  try {
    const sessions = await prisma.driverTraining.findMany({ orderBy: { trainingDate: 'desc' } });
    res.json(sessions);
  } catch (error) {
    next(error);
  }
};

export const createTrainingSession = async (req, res, next) => {
  try {
    const { driverId, trainingType, trainingDate, trainerName, location, durationHours, status, certificateNumber, notes } = req.body;
    const session = await prisma.driverTraining.create({
      data: {
        driverId: Number(driverId),
        trainingType,
        trainingDate: trainingDate ? new Date(trainingDate) : new Date(),
        trainerName: trainerName || null,
        location: location || null,
        durationHours: durationHours ? Number(durationHours) : null,
        status: status || 'Scheduled',
        certificateNumber: certificateNumber || null,
        notes: notes || null,
      },
    });
    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
};

export const getDriverPerformance = async (req, res, next) => {
  try {
    const drivers = await db.findAllDrivers();
    const trips = await db.findAllTrips();
    const performance = drivers.map(driver => {
      const driverTrips = trips.filter(t => String(t.driverId) === String(driver.id));
      const completed = driverTrips.filter(t => t.status === 'Completed').length;
      const totalDistance = driverTrips.reduce((sum, t) => sum + (Number(t.distanceTraveled) || 0), 0);
      return {
        driverId: driver.id,
        driverName: driver.name,
        totalTrips: driverTrips.length,
        completedTrips: completed,
        totalDistance,
        status: driver.status
      };
    });
    res.json(performance);
  } catch (error) {
    next(error);
  }
};
