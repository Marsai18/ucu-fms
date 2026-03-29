/**
 * One-way import: fleet_backend/data.json → MySQL (users + app_documents).
 * Prerequisites: schema from database/schema.sql (or full rebuild), then run
 *   database/migrations/003_mysql_app_documents_and_user_driver.sql
 *
 * Usage (from fleet_backend):  npm run db:import
 * Requires .env with DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
 */
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import '../src/config/loadEnv.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const MAP = {
  vehicles: 'vehicles',
  drivers: 'drivers',
  bookings: 'bookings',
  trips: 'trips',
  fuelLogs: 'fuel_logs',
  maintenanceRecords: 'maintenance_records',
  routes: 'routes',
  incidents: 'incidents',
  notifications: 'notifications',
  activityLogs: 'activity_logs',
};

function normStatus(s) {
  const x = (s || 'active').toLowerCase();
  if (x === 'suspended' || x === 'inactive' || x === 'active') return x;
  return 'active';
}

async function main() {
  if (!process.env.DB_HOST || !process.env.DB_USER) {
    console.error('Missing DB_HOST or DB_USER.\n');
    console.error('Add to the repo root .env (next to VITE_API_URL) or fleet_backend/.env, for example:\n');
    console.error('  DB_HOST=localhost');
    console.error('  DB_USER=root');
    console.error('  DB_PASSWORD=');
    console.error('  DB_NAME=ucu_fleet_management\n');
    process.exit(1);
  }

  const data = JSON.parse(await fs.readFile(path.join(root, 'data.json'), 'utf-8'));

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ucu_fleet_management',
    multipleStatements: true,
  });

  const migPath = path.join(root, 'database', 'migrations', '003_mysql_app_documents_and_user_driver.sql');
  let migSql;
  try {
    migSql = await fs.readFile(migPath, 'utf-8');
  } catch {
    migSql = null;
  }
  if (migSql) {
    try {
      await conn.query(migSql);
      console.log('Applied migration 003 (app_documents + driver_id).');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('Migration 003: driver_id already exists — continuing.');
      } else {
        throw e;
      }
    }
  }

  await conn.query('SET FOREIGN_KEY_CHECKS=0');
  await conn.query('DELETE FROM app_documents');
  await conn.query('DELETE FROM users');
  await conn.query('SET FOREIGN_KEY_CHECKS=1');

  const users = data.users || [];
  for (const u of users) {
    const driverId = u.driverId != null && u.driverId !== '' ? Number(u.driverId) : null;
    await conn.query(
      `INSERT INTO users (id, username, email, password, name, role, phone, status, driver_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        Number(u.id),
        u.username,
        u.email,
        u.password,
        u.name,
        u.role,
        u.phone?.trim() || null,
        normStatus(u.status),
        driverId,
      ]
    );
  }

  const maxUserId = users.reduce((m, u) => Math.max(m, Number(u.id) || 0), 0);
  if (maxUserId > 0) {
    await conn.query(`ALTER TABLE users AUTO_INCREMENT = ${maxUserId + 1}`);
  }

  for (const [jsonKey, coll] of Object.entries(MAP)) {
    const arr = data[jsonKey];
    if (!Array.isArray(arr)) continue;
    for (const item of arr) {
      if (item == null || item.id == null) continue;
      await conn.query(
        'INSERT INTO app_documents (collection, doc_id, payload) VALUES (?, ?, ?)',
        [coll, String(item.id), JSON.stringify(item)]
      );
    }
    console.log(`Imported ${arr.length} rows → ${coll}`);
  }

  const ad = data.assignmentDrafts && typeof data.assignmentDrafts === 'object' ? data.assignmentDrafts : {};
  await conn.query(
    'INSERT INTO app_documents (collection, doc_id, payload) VALUES (?, ?, ?)',
    ['assignment_drafts', '_root', JSON.stringify(ad)]
  );
  console.log('Imported assignment_drafts → _root');

  const ts = Array.isArray(data.trainingSessions) ? data.trainingSessions : [];
  await conn.query(
    'INSERT INTO app_documents (collection, doc_id, payload) VALUES (?, ?, ?)',
    ['training_sessions', '_root', JSON.stringify(ts)]
  );
  console.log(`Imported training_sessions (${ts.length} items)`);

  await conn.end();
  console.log('\nDone. Restart the API with DB_* in .env to use MySQL.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
