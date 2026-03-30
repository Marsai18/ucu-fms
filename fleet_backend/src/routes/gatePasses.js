import express from 'express';
import { requireAdmin, authenticateToken } from '../middleware/auth.js';
import { createGatePass, getDriverGatePasses, scanGatePass } from '../controllers/gatePassController.js';

const router = express.Router();

// Admin generate (or re-use unused) gate pass token for a trip
router.post('/', authenticateToken, requireAdmin, createGatePass);

// Driver fetch their gate passes (used + unused)
router.get('/driver', authenticateToken, (req, res, next) => {
  if (req.user?.role !== 'driver' && !req.user?.driverId) {
    return res.status(403).json({ error: 'Driver access required' });
  }
  return getDriverGatePasses(req, res, next);
});

// Public scan endpoint: marks gate pass as used (one-time)
router.post('/scan', scanGatePass);

export default router;

