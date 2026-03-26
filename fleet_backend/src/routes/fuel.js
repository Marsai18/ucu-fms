import express from 'express';
import {
  getFuelLogs,
  createFuelLog,
  getFuelStatistics,
  getLiveFuelPrice,
  getFuelEstimate
} from '../controllers/fuelController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, getFuelLogs);
router.get('/statistics', authenticateToken, getFuelStatistics);
router.get('/price/live', authenticateToken, getLiveFuelPrice);
router.post('/estimate', authenticateToken, getFuelEstimate);
router.post('/', authenticateToken, createFuelLog);

export default router;


