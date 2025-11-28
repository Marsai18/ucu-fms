import express from 'express';
import {
  getBookingRequests,
  getBookingById,
  createBookingRequest,
  updateBookingStatus,
  approveBooking,
  rejectBooking
} from '../controllers/bookingController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, getBookingRequests);
router.get('/:id', authenticateToken, getBookingById);
router.post('/', authenticateToken, createBookingRequest);
router.put('/:id/status', authenticateToken, updateBookingStatus);
router.post('/:id/approve', authenticateToken, approveBooking);
router.post('/:id/reject', authenticateToken, rejectBooking);

export default router;


