import express from 'express';
import {
  getMaintenanceRecords,
  createMaintenanceRecord,
  getMaintenanceStatistics
} from '../controllers/maintenanceController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, getMaintenanceRecords);
router.get('/statistics', authenticateToken, getMaintenanceStatistics);
router.post('/', authenticateToken, createMaintenanceRecord);

export default router;


