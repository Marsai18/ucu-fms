-- UCU Fleet Management System Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'manager', 'driver', 'user') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Vehicle Acquisitions table
CREATE TABLE IF NOT EXISTS vehicle_acquisitions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  need_assessment TEXT,
  vehicle_type VARCHAR(50),
  purpose VARCHAR(255),
  estimated_cost DECIMAL(15, 2),
  budget_approved ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  purchase_date DATE,
  supplier VARCHAR(255),
  purchase_cost DECIMAL(15, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  acquisition_id INT,
  plate_number VARCHAR(50) UNIQUE NOT NULL,
  make VARCHAR(100),
  model VARCHAR(100),
  year INT,
  chassis_number VARCHAR(100),
  engine_number VARCHAR(100),
  fuel_type ENUM('Diesel', 'Petrol', 'Electric', 'Hybrid') DEFAULT 'Diesel',
  fuel_capacity DECIMAL(10, 2),
  odometer_reading DECIMAL(10, 2) DEFAULT 0,
  operational_status ENUM('Active', 'Inactive', 'Maintenance', 'Retired') DEFAULT 'Active',
  last_service_date DATE,
  next_service_due_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (acquisition_id) REFERENCES vehicle_acquisitions(id) ON DELETE SET NULL
);

-- Drivers table
CREATE TABLE IF NOT EXISTS drivers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  name VARCHAR(255) NOT NULL,
  license_number VARCHAR(100) UNIQUE NOT NULL,
  license_expiry DATE,
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  emergency_contact VARCHAR(255),
  status ENUM('Active', 'Inactive', 'Pending Renewal', 'Suspended') DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Training Sessions table
CREATE TABLE IF NOT EXISTS training_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  status ENUM('Scheduled', 'Completed', 'Cancelled') DEFAULT 'Scheduled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Driver Training junction table
CREATE TABLE IF NOT EXISTS driver_training (
  id INT AUTO_INCREMENT PRIMARY KEY,
  driver_id INT NOT NULL,
  training_id INT NOT NULL,
  attendance_status ENUM('Present', 'Absent', 'Pending') DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE,
  FOREIGN KEY (training_id) REFERENCES training_sessions(id) ON DELETE CASCADE,
  UNIQUE KEY unique_driver_training (driver_id, training_id)
);

-- Booking Requests table
CREATE TABLE IF NOT EXISTS booking_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_id VARCHAR(50) UNIQUE NOT NULL,
  vehicle_id INT NOT NULL,
  driver_id INT,
  user_id INT,
  purpose TEXT,
  destination VARCHAR(255),
  start_date DATETIME NOT NULL,
  end_date DATETIME NOT NULL,
  status ENUM('Pending', 'Approved', 'Rejected', 'Completed', 'Cancelled') DEFAULT 'Pending',
  approved_by INT,
  approved_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Trips table
CREATE TABLE IF NOT EXISTS trips (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT,
  vehicle_id INT NOT NULL,
  driver_id INT NOT NULL,
  origin VARCHAR(255),
  destination VARCHAR(255),
  start_odometer DECIMAL(10, 2),
  end_odometer DECIMAL(10, 2),
  distance_traveled DECIMAL(10, 2),
  departure_time DATETIME,
  arrival_time DATETIME,
  status ENUM('Pending', 'In Progress', 'Completed', 'Cancelled') DEFAULT 'Pending',
  driver_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES booking_requests(id) ON DELETE SET NULL,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE
);

-- Fuel Logs table
CREATE TABLE IF NOT EXISTS fuel_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  fuel_type ENUM('Diesel', 'Petrol') DEFAULT 'Diesel',
  quantity DECIMAL(10, 2) NOT NULL,
  cost DECIMAL(15, 2) NOT NULL,
  odometer_reading DECIMAL(10, 2) NOT NULL,
  station VARCHAR(255),
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

-- Maintenance Records table
CREATE TABLE IF NOT EXISTS maintenance_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  service_date DATE NOT NULL,
  service_type VARCHAR(255) NOT NULL,
  description TEXT,
  odometer_reading DECIMAL(10, 2),
  cost DECIMAL(15, 2),
  mechanic_details VARCHAR(255),
  next_service_due_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

-- Routes table
CREATE TABLE IF NOT EXISTS routes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  origin VARCHAR(255) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  vehicle_id INT,
  driver_id INT,
  purpose TEXT,
  estimated_distance DECIMAL(10, 2),
  estimated_time VARCHAR(50),
  actual_distance DECIMAL(10, 2),
  actual_time VARCHAR(50),
  status ENUM('Scheduled', 'Active', 'Completed', 'Cancelled') DEFAULT 'Scheduled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL,
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL
);

-- Incidents table
CREATE TABLE IF NOT EXISTS incidents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  incident_type VARCHAR(100) NOT NULL,
  vehicle_id INT NOT NULL,
  driver_id INT,
  date DATE NOT NULL,
  location VARCHAR(255),
  description TEXT NOT NULL,
  severity ENUM('Low', 'Medium', 'High') DEFAULT 'Low',
  status ENUM('Reported', 'Under Investigation', 'Repair Scheduled', 'Closed') DEFAULT 'Reported',
  damage_description TEXT,
  reported_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL,
  FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Driver Performance Metrics table
CREATE TABLE IF NOT EXISTS driver_performance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  driver_id INT NOT NULL,
  trips_completed INT DEFAULT 0,
  on_time_rate DECIMAL(5, 2) DEFAULT 0,
  safety_score DECIMAL(5, 2) DEFAULT 0,
  fuel_efficiency DECIMAL(5, 2) DEFAULT 0,
  customer_rating DECIMAL(3, 2) DEFAULT 0,
  period_start DATE,
  period_end DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE
);

-- Activity Logs table (for dashboard)
CREATE TABLE IF NOT EXISTS activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type VARCHAR(100) NOT NULL,
  vehicle_id INT,
  driver_id INT,
  user_id INT,
  description TEXT,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL,
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);


