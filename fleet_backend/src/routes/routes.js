import express from 'express';
import {
  getRoutes,
  createRoute,
  updateRoute
} from '../controllers/routeController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, getRoutes);
router.post('/', authenticateToken, createRoute);
router.put('/:id', authenticateToken, updateRoute);

export default router;


