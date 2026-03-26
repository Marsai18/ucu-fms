import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { getDriverProfile, getDriverTrips, getDriverRoutes, getDriverFuelLogs, createDriverFuelLog, acceptTrip, rejectTrip, createDriverIncident, getDriverIncidents } from '../controllers/driverController.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/profile', getDriverProfile);
router.get('/trips', getDriverTrips);
router.get('/routes', getDriverRoutes);
router.post('/trips/:id/accept', acceptTrip);
router.post('/trips/:id/reject', rejectTrip);
router.get('/fuel-logs', getDriverFuelLogs);
router.post('/fuel-logs', createDriverFuelLog);
router.get('/incidents', getDriverIncidents);
router.post('/incidents', createDriverIncident);

export default router;
