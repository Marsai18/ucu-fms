import express from 'express';
import {
  getDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deleteDriver,
  getTrainingSessions,
  createTrainingSession,
  getDriverPerformance
} from '../controllers/driversController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, getDrivers);
router.get('/training/sessions', authenticateToken, getTrainingSessions);
router.post('/training/sessions', authenticateToken, createTrainingSession);
router.get('/performance/all', authenticateToken, getDriverPerformance);
router.post('/', authenticateToken, createDriver);
router.get('/:id', authenticateToken, getDriverById);
router.put('/:id', authenticateToken, updateDriver);
router.delete('/:id', authenticateToken, deleteDriver);

export default router;


