import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  setUserPassword,
  setUserStatus,
  getPasswordInfo,
} from '../controllers/usersController.js';

const router = express.Router();

router.get('/', authenticateToken, requireAdmin, getUsers);
router.post('/', authenticateToken, requireAdmin, createUser);
router.put('/:id/status', authenticateToken, requireAdmin, setUserStatus);
// GET + PUT same path: view password info (GET) vs set password (PUT)
router.get('/:id/password', authenticateToken, requireAdmin, getPasswordInfo);
router.put('/:id/password', authenticateToken, requireAdmin, setUserPassword);
router.get('/:id', authenticateToken, requireAdmin, getUserById);
router.put('/:id', authenticateToken, requireAdmin, updateUser);

export default router;
