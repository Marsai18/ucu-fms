import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

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
    charset: 'utf8mb4'
  };

  pool = mysql.createPool(config);

  // Test connection
  pool.getConnection()
    .then(connection => {
      console.log('✅ MySQL database connected successfully');
      connection.release();
    })
    .catch(error => {
      console.warn('⚠️ MySQL connection failed, falling back to JSON storage:', error.message);
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
  activityLogs: []
};

export const readData = async () => {
  if (pool) {
    throw new Error('MySQL is configured. Use db.js utilities instead.');
  }
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    await writeData(initialData);
    return initialData;
  }
};

export const writeData = async (data) => {
  if (pool) {
    throw new Error('MySQL is configured. Use db.js utilities instead.');
  }
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
};

export const getNextId = (items) => {
  if (items.length === 0) return '1';
  const maxId = Math.max(...items.map(item => parseInt(item.id) || 0));
  return String(maxId + 1);
};

// Export pool for MySQL usage
export { pool };
export default pool;
