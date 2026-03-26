import express from 'express';
import {
  getBookingRequests,
  getBookingById,
  getRoutePreview,
  saveAssignmentDraft,
  getAssignmentDraft,
  createBookingRequest,
  updateBookingStatus,
  approveBooking,
  rejectBooking
} from '../controllers/bookingController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, getBookingRequests);
router.get('/:id/route-preview', authenticateToken, getRoutePreview);
router.put('/:id/assignment-draft', authenticateToken, saveAssignmentDraft);
router.get('/:id/assignment-draft', authenticateToken, getAssignmentDraft);
router.get('/:id', authenticateToken, getBookingById);
router.post('/', authenticateToken, createBookingRequest);
router.put('/:id/status', authenticateToken, updateBookingStatus);
router.post('/:id/approve', authenticateToken, approveBooking);
router.post('/:id/reject', authenticateToken, rejectBooking);

export default router;


