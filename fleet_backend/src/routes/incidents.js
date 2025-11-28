import express from 'express';
import {
  getIncidents,
  getIncidentById,
  createIncident,
  updateIncident
} from '../controllers/incidentController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, getIncidents);
router.get('/:id', authenticateToken, getIncidentById);
router.post('/', authenticateToken, createIncident);
router.put('/:id', authenticateToken, updateIncident);

export default router;


