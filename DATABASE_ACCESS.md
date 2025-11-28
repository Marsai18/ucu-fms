# How to Access Your MySQL Database

This guide shows you multiple ways to access and manage your UCU Fleet Management database.

## Method 1: MySQL Command Line (Built-in)

### Windows:

1. **Open Command Prompt or PowerShell as Administrator**

2. **Navigate to MySQL bin directory** (if MySQL is in your PATH, skip this):
```powershell
cd "C:\Program Files\MySQL\MySQL Server 8.0\bin"
```

3. **Connect to MySQL**:
```bash
mysql -u root -p
```

4. **Enter your MySQL password** when prompted (press Enter if no password)

5. **Use the database**:
```sql
USE ucu_fleet_management;
SHOW TABLES;
SELECT * FROM users;
SELECT * FROM vehicles;
SELECT * FROM drivers;
```

### macOS/Linux:

```bash
mysql -u root -p
```

Then:
```sql
USE ucu_fleet_management;
SHOW TABLES;
```

## Method 2: MySQL Workbench (Graphical Interface)

### Installation:

1. **Download MySQL Workbench**: https://dev.mysql.com/downloads/workbench/
2. **Install** the application
3. **Open MySQL Workbench**

### Connection Setup:

1. Click **"+"** next to "MySQL Connections"
2. Fill in:
   - **Connection Name**: UCU Fleet Management
   - **Hostname**: `localhost`
   - **Port**: `3306`
   - **Username**: `root`
   - **Password**: Click "Store in Keychain" and enter your MySQL password
3. Click **"Test Connection"** to verify
4. Click **"OK"** to save

### Using MySQL Workbench:

1. **Double-click** your connection to connect
2. **Select database**: Click on `ucu_fleet_management` in the left sidebar
3. **View tables**: Expand the database to see all tables
4. **Run queries**: Use the query editor at the top

### Useful Queries:

```sql
-- View all users
SELECT * FROM users;

-- View all vehicles
SELECT * FROM vehicles;

-- View all drivers
SELECT * FROM drivers;

-- View all bookings
SELECT * FROM booking_requests;

-- View booking with vehicle and driver info
SELECT 
    br.id,
    br.request_id,
    v.plate_number,
    v.make,
    v.model,
    d.name as driver_name,
    br.status,
    br.start_date,
    br.end_date
FROM booking_requests br
LEFT JOIN vehicles v ON br.vehicle_id = v.id
LEFT JOIN drivers d ON br.driver_id = d.id;

-- View fuel logs
SELECT * FROM fuel_logs ORDER BY date DESC;

-- View maintenance records
SELECT * FROM maintenance_records ORDER BY service_date DESC;

-- Count vehicles by status
SELECT operational_status, COUNT(*) as count 
FROM vehicles 
GROUP BY operational_status;

-- View recent activity
SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 20;
```

## Method 3: VS Code MySQL Extension

1. **Install MySQL Extension** in VS Code:
   - Open VS Code Extensions (Ctrl+Shift+X)
   - Search for "MySQL"
   - Install "MySQL" by Jun Han

2. **Connect**:
   - Press `Ctrl+Shift+P`
   - Type "MySQL: New Connection"
   - Enter:
     - Host: `localhost`
     - Port: `3306`
     - User: `root`
     - Password: (your MySQL password)
     - Database: `ucu_fleet_management`

3. **Browse** your database in the sidebar

## Method 4: phpMyAdmin (Web Interface)

### Installation:

**Windows (XAMPP)**:
1. Download XAMPP: https://www.apachefriends.org/
2. Install XAMPP (includes MySQL and phpMyAdmin)
3. Start Apache and MySQL from XAMPP Control Panel
4. Open browser: `http://localhost/phpmyadmin`

**macOS/Linux**:
```bash
# Install phpMyAdmin
sudo apt-get install phpmyadmin  # Ubuntu/Debian
brew install phpmyadmin          # macOS with Homebrew
```

### Using phpMyAdmin:

1. Open `http://localhost/phpmyadmin`
2. Login with:
   - Username: `root`
   - Password: (your MySQL password)
3. Select `ucu_fleet_management` database from left sidebar
4. Browse tables, run queries, and manage data

## Method 5: DBeaver (Free Database Tool)

1. **Download**: https://dbeaver.io/download/
2. **Install** DBeaver
3. **Create Connection**:
   - Click "New Database Connection"
   - Select "MySQL"
   - Enter:
     - Host: `localhost`
     - Port: `3306`
     - Database: `ucu_fleet_management`
     - Username: `root`
     - Password: (your MySQL password)
4. **Connect** and browse your database

## Common Database Operations

### View All Tables:
```sql
SHOW TABLES;
```

### View Table Structure:
```sql
DESCRIBE users;
-- or
SHOW COLUMNS FROM vehicles;
```

### View Table Data:
```sql
SELECT * FROM vehicles;
SELECT * FROM drivers LIMIT 10;
```

### Count Records:
```sql
SELECT COUNT(*) FROM vehicles;
SELECT COUNT(*) FROM drivers;
```

### Insert Test Data:
```sql
-- Insert a test vehicle
INSERT INTO vehicles (plate_number, make, model, year, fuel_type, operational_status)
VALUES ('UCU 999', 'Toyota', 'Land Cruiser', 2023, 'Diesel', 'Active');

-- Insert a test driver
INSERT INTO drivers (name, license_number, license_expiry, phone, email, status)
VALUES ('Test Driver', 'DL999999', '2025-12-31', '+256 700 999 999', 'test@ucu.ac.ug', 'Active');
```

### Update Data:
```sql
-- Update vehicle status
UPDATE vehicles SET operational_status = 'Active' WHERE id = 1;

-- Update driver info
UPDATE drivers SET phone = '+256 700 888 888' WHERE id = 1;
```

### Delete Data:
```sql
-- Delete a vehicle (use with caution!)
DELETE FROM vehicles WHERE id = 1;
```

### Reset Database (if needed):
```bash
# From backend directory
cd backend
npm run init-db
```

## Quick Database Check Commands

```sql
-- Check if database exists
SHOW DATABASES LIKE 'ucu_fleet_management';

-- Use the database
USE ucu_fleet_management;

-- Check tables
SHOW TABLES;

-- Check users
SELECT id, username, email, role FROM users;

-- Check vehicles count
SELECT COUNT(*) as total_vehicles FROM vehicles;

-- Check drivers count
SELECT COUNT(*) as total_drivers FROM drivers;
```

## Database Connection from Backend

The backend connects using these settings (from `backend/.env`):
- **Host**: `localhost`
- **Port**: `3306`
- **User**: `root`
- **Password**: (as set in `.env`)
- **Database**: `ucu_fleet_management`

## Troubleshooting

### "Access Denied" Error:
- Check your MySQL password in `backend/.env`
- Verify MySQL service is running
- Try resetting MySQL password if needed

### "Can't Connect to MySQL Server":
- Ensure MySQL service is running
  - Windows: Services → MySQL
  - macOS/Linux: `sudo service mysql start`

### "Database Doesn't Exist":
```bash
cd backend
npm run init-db
```

## Recommended Tool

**For beginners**: MySQL Workbench (easiest GUI)
**For developers**: VS Code MySQL Extension or DBeaver
**For quick access**: Command line MySQL

Choose the method that works best for you! 🚀














