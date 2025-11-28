import database from '../config/database.js';
import { readData } from '../config/database.js';
import bcrypt from 'bcrypt';
import { generateToken } from '../utils/jwt.js';

const { pool } = database || {};

export const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    let user;

    // Use MySQL if available, otherwise use JSON
    if (pool && typeof pool.query === 'function') {
      const [users] = await pool.query(
        'SELECT * FROM users WHERE username = ? OR email = ?',
        [username, username]
      );

      if (users.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      user = users[0];

      // Verify password using bcrypt
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    } else {
      // Fallback to JSON storage
      const data = await readData();
      user = data.users.find(u => u.username === username && u.password === password);

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    }

    const token = generateToken({
      id: user.id,
      username: user.username,
      role: user.role
    });

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      ok: true,
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (req, res, next) => {
  try {
    let user;

    if (pool && typeof pool.query === 'function') {
      const [users] = await pool.query(
        'SELECT id, username, email, name, role, status, created_at, updated_at FROM users WHERE id = ?',
        [req.user.id]
      );

      if (users.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      user = users[0];
    } else {
      const data = await readData();
      user = data.users.find(u => u.id === String(req.user.id));

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    next(error);
  }
};
