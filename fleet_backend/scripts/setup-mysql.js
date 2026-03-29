/**
 * Creates DB, applies ucu_fleet_management_full_rebuild.sql + migration 003.
 * Usage: node scripts/setup-mysql.js
 * Requires root .env or fleet_backend/.env with DB_* (same as db:import).
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import '../src/config/loadEnv.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const host = process.env.DB_HOST || 'localhost';
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD ?? '';
const dbName = process.env.DB_NAME || 'ucu_fleet_management';

async function main() {
  console.log('Connecting to MySQL (no database yet)...');
  let conn = await mysql.createConnection({
    host,
    user,
    password,
    multipleStatements: true,
  });

  await conn.query(
    `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  console.log(`Database '${dbName}' ready.`);
  await conn.end();

  conn = await mysql.createConnection({
    host,
    user,
    password,
    database: dbName,
    multipleStatements: true,
  });

  const rebuildPath = path.join(root, 'database', 'ucu_fleet_management_full_rebuild.sql');
  const sql = await fs.readFile(rebuildPath, 'utf-8');
  console.log('Applying ucu_fleet_management_full_rebuild.sql (this may take a moment)...');
  await conn.query(sql);
  console.log('Schema applied.');

  const migPath = path.join(root, 'database', 'migrations', '003_mysql_app_documents_and_user_driver.sql');
  const mig = await fs.readFile(migPath, 'utf-8');
  try {
    await conn.query(mig);
    console.log('Migration 003 applied (app_documents + driver_id).');
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME' || String(e.message).includes('Duplicate column')) {
      console.log('Migration 003: driver_id column already present — OK.');
    } else {
      throw e;
    }
  }

  await conn.end();
  console.log('\nNext: npm run db:import   (copies data.json into MySQL)\n');
}

main().catch((err) => {
  console.error('\nSetup failed:', err.message);
  if (err.code === 'ECONNREFUSED') {
    console.error('Is MySQL Server running? Install/start MySQL (or XAMPP MySQL), then retry.');
  } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
    console.error('Check DB_USER / DB_PASSWORD in .env (must match your MySQL root user).');
  }
  process.exit(1);
});
