import express from 'express';
import { login, getCurrentUser, getDemoToken } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.post('/demo-token', getDemoToken);
router.get('/me', authenticateToken, getCurrentUser);

export default router;


