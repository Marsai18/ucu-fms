import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const connectionConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 3306,
};

async function initDatabase() {
  let connection;
  
  try {
    // Connect to MySQL server (without database)
    connection = await mysql.createConnection(connectionConfig);
    
    const dbName = process.env.DB_NAME || 'ucu_fleet_management';
    
    // Create database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`Database '${dbName}' created or already exists.`);
    
    // Select the database
    await connection.query(`USE \`${dbName}\``);
    
    // Read and execute schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = schema.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        await connection.query(statement);
      }
    }
    
    console.log('Database schema initialized successfully!');
    
    // Insert default admin user
    const bcrypt = (await import('bcrypt')).default;
    const hashedPassword = await bcrypt.hash('masai123', 10);
    
    await connection.query(`
      INSERT IGNORE INTO users (username, email, password, role, created_at) 
      VALUES ('masai', 'masai@ucu.ac.ug', ?, 'admin', NOW())
    `, [hashedPassword]);
    
    console.log('Default admin user created (username: masai, password: masai123)');
    
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initDatabase();


