import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import '../src/config/loadEnv.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true,
  charset: 'utf8mb4',
  // Allow empty password for local development
  allowPublicKeyRetrieval: true
};

async function initDatabase() {
  let connection;

  try {
    console.log('Connecting to MySQL server...');
    // Connect without specifying database first
    connection = await mysql.createConnection(config);

    // Create database if it doesn't exist
    console.log('Creating database if not exists...');
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'ucu_fleet_management'} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    
    // Use the database
    await connection.query(`USE ${process.env.DB_NAME || 'ucu_fleet_management'}`);

    // Read and execute schema
    console.log('Reading schema file...');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf-8');
    
    // Remove CREATE DATABASE and USE statements from schema since we already did that
    const cleanedSchema = schema
      .replace(/CREATE DATABASE.*?;/gi, '')
      .replace(/USE.*?;/gi, '');

    console.log('Executing schema...');
    await connection.query(cleanedSchema);

    // Insert default users with hashed passwords
    console.log('Inserting default users...');
    const hashedAdminPassword = await bcrypt.hash('masai123', 10);
    const hashedClientPassword = await bcrypt.hash('client123', 10);

    await connection.query(`
      INSERT INTO users (username, email, password, name, role, status) VALUES
      (?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE username=username
    `, [
      'masai', 'masai.absalom@ucu.ac.ug', hashedAdminPassword, 'Masai', 'admin', 'active',
      'client@ucu.ac.ug', 'client@ucu.ac.ug', hashedClientPassword, 'Client User', 'client', 'active'
    ]);

    // Insert default drivers
    console.log('Inserting default drivers...');
    await connection.query(`
      INSERT INTO drivers (name, license_number, phone, email, status) VALUES
      (?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE license_number=license_number
    `, [
      'Masai', 'DL-001', '+256 700 000 001', 'masai.absalom@ucu.ac.ug', 'Active',
      'Patrick', 'DL-002', '+256 700 000 002', 'patrick@ucu.ac.ug', 'Active',
      'Kasimu', 'DL-003', '+256 700 000 003', 'kasimu@ucu.ac.ug', 'Active'
    ]);

    console.log('✅ Database initialized successfully!');
    console.log('\nDefault credentials:');
    console.log('Admin - Username: masai (or masai.absalom@ucu.ac.ug), Password: masai123');
    console.log('Client - Username: client@ucu.ac.ug, Password: client123');

  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initDatabase();

