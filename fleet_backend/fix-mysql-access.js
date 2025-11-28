import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

async function testConnection(password = '') {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: password,
      port: process.env.DB_PORT || 3306,
    });
    
    await connection.end();
    return true;
  } catch (error) {
    return false;
  }
}

async function fixDatabase() {
  console.log('🔧 Fixing MySQL Access Issue...\n');
  
  // Try to connect with empty password first
  console.log('1. Testing connection with empty password...');
  let password = process.env.DB_PASSWORD || '';
  let canConnect = await testConnection(password);
  
  if (!canConnect) {
    console.log('   ❌ Empty password failed\n');
    console.log('⚠️  MySQL requires a password!\n');
    console.log('Please do one of the following:');
    console.log('');
    console.log('Option 1: Add your MySQL password to fleet_backend/.env file:');
    console.log('   DB_PASSWORD=your_password_here');
    console.log('');
    console.log('Option 2: Reset MySQL root password to empty:');
    console.log('   mysql -u root -p');
    console.log('   ALTER USER root@localhost IDENTIFIED BY "";');
    console.log('   FLUSH PRIVILEGES;');
    console.log('');
    console.log('Option 3: Create a new MySQL user without password:');
    console.log('   mysql -u root -p');
    console.log('   CREATE USER "fms_user"@"localhost";');
    console.log('   GRANT ALL PRIVILEGES ON *.* TO "fms_user"@"localhost";');
    console.log('   FLUSH PRIVILEGES;');
    console.log('   Then update fleet_backend/.env: DB_USER=fms_user');
    console.log('');
    process.exit(1);
  }
  
  console.log('   ✅ Connection successful!\n');
  
  console.log('2. Initializing database...');
  
  try {
    let connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: password,
      port: process.env.DB_PORT || 3306,
    });
    
    const dbName = process.env.DB_NAME || 'ucu_fleet_management';
    
    // Create database
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`   ✅ Database '${dbName}' ready\n`);
    
    // Use database
    await connection.query(`USE \`${dbName}\``);
    
    // Read and execute schema
    const schemaPath = path.join(__dirname, 'src', 'config', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    const statements = schema.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await connection.query(statement);
        } catch (err) {
          // Ignore table already exists errors
          if (err.code !== 'ER_TABLE_EXISTS_ERROR' && err.code !== 'ER_DUP_ENTRY') {
            console.error(`   ⚠️  Warning: ${err.message}`);
          }
        }
      }
    }
    
    console.log('   ✅ Schema initialized\n');
    
    // Insert default admin user
    const bcrypt = (await import('bcrypt')).default;
    const hashedPassword = await bcrypt.hash('masai123', 10);
    
    // Delete existing user if exists (to reset password)
    await connection.query(`DELETE FROM users WHERE username = 'masai'`);
    
    // Insert admin user
    await connection.query(`
      INSERT INTO users (username, email, password, role, created_at) 
      VALUES ('masai', 'masai@ucu.ac.ug', ?, 'admin', NOW())
    `, [hashedPassword]);
    
    console.log('   ✅ Admin user created:\n');
    console.log('      Username: masai');
    console.log('      Password: masai123');
    console.log('      Role: admin\n');
    
    await connection.end();
    
    console.log('✅ Database setup complete!\n');
    console.log('You can now start the backend server:');
    console.log('   npm run dev\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n⚠️  Access denied! Please check your MySQL password in fleet_backend/.env\n');
    }
    process.exit(1);
  }
}

fixDatabase();


