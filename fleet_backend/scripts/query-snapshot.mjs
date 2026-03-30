/**
 * Quick read-only snapshot of key tables. Usage: node scripts/query-snapshot.mjs
 * Uses DB_* from repo root .env / fleet_backend/.env via loadEnv.
 */
import mysql from 'mysql2/promise';
import '../src/config/loadEnv.js';

const host = process.env.DB_HOST || 'localhost';
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD ?? '';
const database = process.env.DB_NAME || 'ucu_fleet_management';

const conn = await mysql.createConnection({ host, user, password, database });

const [tables] = await conn.query('SHOW TABLES');
const tableNames = tables.map((r) => Object.values(r)[0]);
console.log('=== Tables ===\n', tableNames.join(', '), '\n');

const [users] = await conn.query(
  'SELECT id, username, email, role, status FROM users ORDER BY id LIMIT 20'
);
console.log('=== users (up to 20) ===');
console.table(users);

const [vehicles] = await conn.query(
  'SELECT id, plate_number, make, model, operational_status FROM vehicles ORDER BY id LIMIT 10'
);
console.log('=== vehicles (up to 10) ===');
console.table(vehicles);

const [docCounts] = await conn.query(
  "SELECT collection, COUNT(*) AS rows FROM app_documents GROUP BY collection ORDER BY collection"
);
console.log('=== app_documents by collection ===');
console.table(docCounts);

const [totals] = await conn.query(`
  SELECT
    (SELECT COUNT(*) FROM users) AS users,
    (SELECT COUNT(*) FROM vehicles) AS vehicles,
    (SELECT COUNT(*) FROM bookings) AS bookings,
    (SELECT COUNT(*) FROM app_documents) AS app_documents
`);
console.log('=== totals ===');
console.table(totals);

await conn.end();
