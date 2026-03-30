import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import './loadEnv.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '..', '..', 'data.json');

// Check if MySQL should be used (if DB_HOST is set in .env)
const USE_MYSQL = process.env.DB_HOST && process.env.DB_USER;

let pool = null;

// Try MySQL connection if configured
if (USE_MYSQL) {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ucu_fleet_management',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4',
  };

  pool = mysql.createPool(config);

  // Test connection
  pool
    .getConnection()
    .then((connection) => {
      console.log('✅ MySQL database connected successfully');
      connection.release();
    })
    .catch((error) => {
      console.warn('⚠️ MySQL connection failed, falling back to JSON storage:', error.message);
      if (error.code === 'ER_ACCESS_DENIED_ERROR') {
        console.warn('   → Fix: set DB_PASSWORD in .env to match MySQL, or run: ALTER USER ... IDENTIFIED BY \'yourpassword\';');
        console.warn('   → See fleet_backend/MYSQL_SETUP_GUIDE.md');
      }
      console.log('Using JSON file storage instead...');
      pool = null;
    });
} else {
  console.log('📁 Using JSON file storage (set DB_HOST in .env to use MySQL)');
}

// JSON file storage functions (fallback)
const initialData = {
  users: [],
  vehicles: [],
  drivers: [],
  bookings: [],
  trips: [],
  fuelLogs: [],
  maintenanceRecords: [],
  routes: [],
  incidents: [],
  activityLogs: [],
  notifications: [],
  // Gate Passes (one-time QR tokens for trip access)
  gatePasses: [],
};

export const readData = async () => {
  if (pool) {
    throw new Error('MySQL is configured. Use db.js utilities instead.');
  }
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const data = await fs.readFile(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      return parsed && typeof parsed === 'object' ? parsed : initialData;
    } catch (error) {
      if (error.code === 'ENOENT') {
        await writeData(initialData);
        return initialData;
      }
      if (error instanceof SyntaxError) {
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 100));
          continue;
        }
        console.warn('⚠️ data.json parse error:', error.message);
        console.warn('   File:', DATA_FILE, '- using empty data. Restart server after fixing data.json.');
        return initialData;
      }
      throw error;
    }
  }
  return initialData;
};

export const writeData = async (data) => {
  if (pool) {
    throw new Error('MySQL is configured. Use db.js utilities instead.');
  }
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
};

export const getNextId = (items) => {
  if (items.length === 0) return '1';
  const maxId = Math.max(...items.map((item) => parseInt(item.id) || 0));
  return String(maxId + 1);
};

// Export pool for MySQL usage
export { pool };
export default pool;
