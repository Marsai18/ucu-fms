import express from 'express';
import {
  getVehicles,
  getVehicleById,
  createVehicle,
  createVehicleAcquisition,
  updateVehicle,
  deleteVehicle
} from '../controllers/vehicleController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, getVehicles);
router.get('/:id', authenticateToken, getVehicleById);
router.post('/', authenticateToken, createVehicle);
router.post('/acquisition', authenticateToken, createVehicleAcquisition);
router.put('/:id', authenticateToken, updateVehicle);
router.delete('/:id', authenticateToken, deleteVehicle);

export default router;


