import pool from '../config/database.js';
import jsonDb from './db.json.js';
import mysqlDb from './db.mysql.js';

/** JSON file storage when DB_HOST is unset; MySQL + app_documents when pool is active. */
const db = pool && typeof pool.query === 'function' ? mysqlDb : jsonDb;

export default db;
