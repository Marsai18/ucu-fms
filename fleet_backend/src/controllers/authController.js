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

      const st = (user.status || 'active').toLowerCase();
      if (st === 'suspended' || st === 'inactive') {
        return res.status(403).json({
          error: 'This account is suspended or access has been revoked. Contact an administrator.',
        });
      }

      // Plain text (current default) or legacy bcrypt hash
      let passwordMatch = false;
      if (user.password && String(user.password).startsWith('$2')) {
        passwordMatch = await bcrypt.compare(password, user.password);
      } else {
        passwordMatch = user.password === password;
      }
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    } else {
      // Fallback to JSON storage
      const data = await readData();
      user = data.users.find(u => u.username === username || u.email === username);

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const st = (user.status || 'active').toLowerCase();
      if (st === 'suspended' || st === 'inactive') {
        return res.status(403).json({
          error: 'This account is suspended or access has been revoked. Contact an administrator.',
        });
      }

      let passwordMatch = false;
      if (user.password && String(user.password).startsWith('$2')) {
        passwordMatch = await bcrypt.compare(password, user.password);
      } else {
        passwordMatch = user.password === password;
      }
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    }

    const tokenPayload = {
      id: user.id,
      username: user.username,
      role: user.role || 'client'
    };
    if (user.role === 'driver' && user.driverId) {
      tokenPayload.driverId = user.driverId;
    }
    const token = generateToken(tokenPayload);

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

// Demo token for fallback login when main API fails (e.g. CORS during dev)
export const getDemoToken = async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    const demoUsers = [
      { username: 'masai', email: 'masai.absalom@ucu.ac.ug', password: 'masai123', id: '1', role: 'admin', name: 'Masai' },
      { username: 'client@ucu.ac.ug', password: 'client123', id: '2', role: 'client', name: 'Client User' },
      { username: 'david.ssebunya@ucu.ac.ug', password: 'driver123', id: '3', role: 'driver', driverId: '1', name: 'David Ssebunya' },
      { username: 'hod@ucu.ac.ug', password: 'hod123', id: '7', role: 'hod', name: 'Head of Department' },
      { username: 'hod', password: 'hod123', id: '7', role: 'hod', name: 'Head of Department' }
    ];
    const match = demoUsers.find(u =>
      (u.username === username || (u.email && u.email === username)) && u.password === password
    );
    if (!match) {
      return res.status(401).json({ error: 'Invalid demo credentials' });
    }
    const tokenPayload = { id: match.id, username: match.username, role: match.role };
    if (match.driverId) tokenPayload.driverId = match.driverId;
    const token = generateToken(tokenPayload);
    res.json({ token, user: { id: match.id, username: match.username, role: match.role, driverId: match.driverId, name: match.name } });
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
