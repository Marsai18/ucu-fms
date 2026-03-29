import pool, { readData, writeData, getNextId } from '../config/database.js';

/** Detect storage type from raw password string (bcrypt vs plain). */
const storageFromPassword = (raw) => {
  if (raw == null || raw === '') return 'unknown';
  return String(raw).startsWith('$2') ? 'hashed' : 'plaintext';
};

const ALLOWED_ROLES = new Set(['admin', 'client', 'driver', 'hod', 'fleet_manager']);
const ALLOWED_STATUS = new Set(['active', 'inactive', 'suspended']);

const stripPassword = (u) => {
  if (!u) return null;
  const { password: _p, ...rest } = u;
  return { ...rest, id: String(rest.id) };
};

const normalizeStatus = (s) => (s || 'active').toLowerCase();

/** How password is stored (for admin UI only; never send raw password in list). */
const getPasswordStorageMeta = (rawPassword) => storageFromPassword(rawPassword);

const mapMysqlUser = (row) => ({
  id: String(row.id),
  username: row.username,
  email: row.email,
  name: row.name,
  role: row.role,
  phone: row.phone ?? null,
  status: normalizeStatus(row.status),
  driverId: row.driver_id != null ? String(row.driver_id) : undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const getUsers = async (req, res, next) => {
  try {
    if (pool && typeof pool.query === 'function') {
      const [rows] = await pool.query(
        `SELECT id, username, email, name, role, phone, status, driver_id, created_at, updated_at,
         CASE WHEN password LIKE '$2%' THEN 'hashed' ELSE 'plaintext' END AS pwd_storage
         FROM users ORDER BY id ASC`
      );
      return res.json(
        rows.map((row) => ({
          ...mapMysqlUser(row),
          passwordStorage: row.pwd_storage === 'hashed' ? 'hashed' : 'plaintext',
        }))
      );
    }

    const data = await readData();
    const users = (data.users || []).map((u) => {
      const stripped = stripPassword({
        ...u,
        status: normalizeStatus(u.status),
      });
      return {
        ...stripped,
        passwordStorage: getPasswordStorageMeta(u.password),
      };
    });
    res.json(users);
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const id = String(req.params.id);
    if (pool && typeof pool.query === 'function') {
      const [rows] = await pool.query(
        `SELECT id, username, email, name, role, phone, status, driver_id, created_at, updated_at,
         CASE WHEN password LIKE '$2%' THEN 'hashed' ELSE 'plaintext' END AS pwd_storage
         FROM users WHERE id = ?`,
        [id]
      );
      if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
      const row = rows[0];
      return res.json({
        ...mapMysqlUser(row),
        passwordStorage: row.pwd_storage === 'hashed' ? 'hashed' : 'plaintext',
      });
    }

    const data = await readData();
    const user = data.users.find((u) => String(u.id) === id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const stripped = stripPassword({ ...user, status: normalizeStatus(user.status) });
    res.json({ ...stripped, passwordStorage: getPasswordStorageMeta(user.password) });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const { username, email, password, name, role, phone, driverId } = req.body || {};
    if (!username?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }
    const r = role || 'client';
    if (!ALLOWED_ROLES.has(r)) {
      return res.status(400).json({ error: `Invalid role. Allowed: ${[...ALLOWED_ROLES].join(', ')}` });
    }

    const plainPassword = String(password);

    if (pool && typeof pool.query === 'function') {
      const [dup] = await pool.query(
        'SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1',
        [username.trim(), email.trim()]
      );
      if (dup.length) return res.status(409).json({ error: 'Username or email already exists' });

      const driverIdVal =
        r === 'driver' && driverId != null && String(driverId).trim() !== ''
          ? Number(driverId)
          : null;
      const [result] = await pool.query(
        `INSERT INTO users (username, email, password, name, role, phone, status, driver_id)
         VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`,
        [
          username.trim(),
          email.trim(),
          plainPassword,
          (name || username).trim(),
          r,
          phone?.trim() || null,
          driverIdVal,
        ]
      );
      const [rows] = await pool.query(
        `SELECT id, username, email, name, role, phone, status, driver_id, created_at, updated_at FROM users WHERE id = ?`,
        [result.insertId]
      );
      return res.status(201).json({ ...mapMysqlUser(rows[0]), passwordStorage: 'plaintext' });
    }

    const data = await readData();
    if (data.users.some((u) => u.username === username.trim() || u.email === email.trim())) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }
    const user = {
      id: getNextId(data.users),
      username: username.trim(),
      email: email.trim(),
      password: plainPassword,
      name: (name || username).trim(),
      role: r,
      phone: phone?.trim() || '',
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    if (r === 'driver' && driverId) user.driverId = String(driverId);
    data.users.push(user);
    await writeData(data);
    res.status(201).json({ ...stripPassword(user), passwordStorage: 'plaintext' });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const { username, email, name, role, phone, driverId } = req.body || {};

    if (pool && typeof pool.query === 'function') {
      const [existing] = await pool.query('SELECT id FROM users WHERE id = ?', [id]);
      if (existing.length === 0) return res.status(404).json({ error: 'User not found' });

      if (username) {
        const [c1] = await pool.query('SELECT id FROM users WHERE id != ? AND username = ? LIMIT 1', [
          id,
          username.trim(),
        ]);
        if (c1.length) return res.status(409).json({ error: 'Username already in use' });
      }
      if (email) {
        const [c2] = await pool.query('SELECT id FROM users WHERE id != ? AND email = ? LIMIT 1', [
          id,
          email.trim(),
        ]);
        if (c2.length) return res.status(409).json({ error: 'Email already in use' });
      }

      const fields = [];
      const vals = [];
      if (username != null) {
        fields.push('username = ?');
        vals.push(username.trim());
      }
      if (email != null) {
        fields.push('email = ?');
        vals.push(email.trim());
      }
      if (name != null) {
        fields.push('name = ?');
        vals.push(name.trim());
      }
      if (role != null) {
        if (!ALLOWED_ROLES.has(role)) {
          return res.status(400).json({ error: `Invalid role. Allowed: ${[...ALLOWED_ROLES].join(', ')}` });
        }
        fields.push('role = ?');
        vals.push(role);
      }
      if (phone !== undefined) {
        fields.push('phone = ?');
        vals.push(phone?.trim() || null);
      }
      if (driverId !== undefined) {
        fields.push('driver_id = ?');
        vals.push(driverId === null || driverId === '' ? null : Number(driverId));
      }
      if (fields.length === 0) {
        const [rows] = await pool.query(
          `SELECT id, username, email, name, role, phone, status, driver_id, created_at, updated_at FROM users WHERE id = ?`,
          [id]
        );
        return res.json(mapMysqlUser(rows[0]));
      }
      vals.push(id);
      await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, vals);
      const [rows] = await pool.query(
        `SELECT id, username, email, name, role, phone, status, driver_id, created_at, updated_at FROM users WHERE id = ?`,
        [id]
      );
      return res.json(mapMysqlUser(rows[0]));
    }

    const data = await readData();
    const idx = data.users.findIndex((u) => String(u.id) === id);
    if (idx === -1) return res.status(404).json({ error: 'User not found' });

    if (username || email) {
      const clash = data.users.some((u) => {
        if (String(u.id) === id) return false;
        if (username && u.username === username.trim()) return true;
        if (email && u.email === email.trim()) return true;
        return false;
      });
      if (clash) return res.status(409).json({ error: 'Username or email already in use' });
    }

    const u = data.users[idx];
    if (username != null) u.username = username.trim();
    if (email != null) u.email = email.trim();
    if (name != null) u.name = name.trim();
    if (role != null) {
      if (!ALLOWED_ROLES.has(role)) {
        return res.status(400).json({ error: `Invalid role. Allowed: ${[...ALLOWED_ROLES].join(', ')}` });
      }
      u.role = role;
    }
    if (phone !== undefined) u.phone = phone?.trim() || '';
    if (driverId !== undefined) {
      if (driverId === null || driverId === '') delete u.driverId;
      else u.driverId = String(driverId);
    }
    u.updatedAt = new Date().toISOString();
    data.users[idx] = u;
    await writeData(data);
    res.json(stripPassword({ ...u, status: normalizeStatus(u.status) }));
  } catch (error) {
    next(error);
  }
};

export const setUserPassword = async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const { password } = req.body || {};
    if (!password || String(password).length < 6) {
      return res.status(400).json({ error: 'Password is required (min 6 characters)' });
    }

    const adminId = String(req.user.id);
    if (id === adminId) {
      return res.status(400).json({ error: 'Use account settings to change your own password' });
    }

    const plainPassword = String(password);

    if (pool && typeof pool.query === 'function') {
      const [r] = await pool.query('UPDATE users SET password = ? WHERE id = ?', [plainPassword, id]);
      if (r.affectedRows === 0) return res.status(404).json({ error: 'User not found' });
      return res.json({ ok: true, message: 'Password updated' });
    }

    const data = await readData();
    const idx = data.users.findIndex((u) => String(u.id) === id);
    if (idx === -1) return res.status(404).json({ error: 'User not found' });
    data.users[idx].password = plainPassword;
    data.users[idx].updatedAt = new Date().toISOString();
    await writeData(data);
    res.json({ ok: true, message: 'Password updated' });
  } catch (error) {
    next(error);
  }
};

export const setUserStatus = async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const { status } = req.body || {};
    const st = normalizeStatus(status);
    if (!ALLOWED_STATUS.has(st)) {
      return res.status(400).json({ error: 'Invalid status. Use active, inactive, or suspended' });
    }

    const adminId = String(req.user.id);
    if (id === adminId) {
      return res.status(400).json({ error: 'You cannot change your own account status' });
    }

    if (pool && typeof pool.query === 'function') {
      const [rows] = await pool.query('SELECT id, role FROM users WHERE id = ?', [id]);
      if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
      if (st !== 'active' && rows[0].role === 'admin') {
        const [cnt] = await pool.query(
          `SELECT COUNT(*) AS n FROM users WHERE role = 'admin' AND status = 'active' AND id != ?`,
          [id]
        );
        if (cnt[0].n === 0) {
          return res.status(400).json({ error: 'Cannot suspend the last active admin' });
        }
      }
      const [r] = await pool.query('UPDATE users SET status = ? WHERE id = ?', [st, id]);
      if (r.affectedRows === 0) return res.status(404).json({ error: 'User not found' });
      return res.json({ ok: true, status: st, message: st === 'active' ? 'Access restored' : 'Account updated' });
    }

    const data = await readData();
    const idx = data.users.findIndex((u) => String(u.id) === id);
    if (idx === -1) return res.status(404).json({ error: 'User not found' });

    const otherAdmins = data.users.filter(
      (u) => u.role === 'admin' && String(u.id) !== id && normalizeStatus(u.status) === 'active'
    );
    if (data.users[idx].role === 'admin' && st !== 'active' && otherAdmins.length === 0) {
      return res.status(400).json({ error: 'Cannot suspend the last active admin' });
    }

    data.users[idx].status = st;
    data.users[idx].updatedAt = new Date().toISOString();
    await writeData(data);
    res.json({ ok: true, status: st, message: st === 'active' ? 'Access restored' : 'Account updated' });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin-only: return stored password when saved as plain text.
 * Legacy bcrypt rows: not reversible — admin must use “Set password” to replace with plain text.
 */
export const getPasswordInfo = async (req, res, next) => {
  try {
    const id = String(req.params.id);

    if (pool && typeof pool.query === 'function') {
      const [rows] = await pool.query('SELECT password FROM users WHERE id = ?', [id]);
      if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
      const raw = rows[0].password;
      if (raw != null && String(raw).startsWith('$2')) {
        return res.json({
          viewable: false,
          passwordStorage: 'hashed',
          message:
            'This account still has an old bcrypt hash. Use “Set password” once to replace it with a stored plain password you can read here.',
        });
      }
      return res.json({
        viewable: true,
        passwordStorage: 'plaintext',
        password: raw == null ? '' : String(raw),
        message: 'Password as stored in the database (plain text).',
      });
    }

    const data = await readData();
    const user = data.users.find((u) => String(u.id) === id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const raw = user.password;
    if (raw != null && String(raw).startsWith('$2')) {
      return res.json({
        viewable: false,
        passwordStorage: 'hashed',
        message:
          'This account still has a bcrypt hash. Use “Set password” to replace it with a plain password you can view here.',
      });
    }

    return res.json({
      viewable: true,
      passwordStorage: 'plaintext',
      password: raw == null ? '' : String(raw),
      message: 'Password as stored (plain text).',
    });
  } catch (error) {
    next(error);
  }
};
