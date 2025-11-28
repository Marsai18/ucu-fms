import express from 'express';
import {
  getTrips,
  getTripById,
  createTrip,
  updateTrip
} from '../controllers/tripController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, getTrips);
router.get('/:id', authenticateToken, getTripById);
router.post('/', authenticateToken, createTrip);
router.put('/:id', authenticateToken, updateTrip);

export default router;


