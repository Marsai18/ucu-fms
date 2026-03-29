-- =============================================================================
-- UCU Fleet Management System — FULL DATABASE REBUILD (MySQL 8+ / InnoDB)
-- =============================================================================
-- Source of truth: fleet_backend/database/schema.sql
-- Migration merged: database/migrations/001_add_hod_to_user_role.sql (HOD role on users)
-- Legacy file NOT merged: fleet_backend/src/config/schema.sql (alternate schema; unused by initDatabase.js)
--
-- Execution: run as a user with CREATE DATABASE privileges. Adjust DB_NAME if needed.
-- No triggers, views, stored procedures, or functions exist in this project’s SQL assets.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. DATABASE CREATION
-- -----------------------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS ucu_fleet_management
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ucu_fleet_management;

-- -----------------------------------------------------------------------------
-- 2. TABLE CREATION (dependency order: no foreign keys in this section)
-- -----------------------------------------------------------------------------

-- --- USERS ---
CREATE TABLE users (
    id INT AUTO_INCREMENT,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role ENUM('admin', 'client', 'driver', 'hod', 'fleet_manager') NOT NULL DEFAULT 'client',
    phone VARCHAR(20) NULL,
    status ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_users_username (username),
    UNIQUE KEY uk_users_email (email(191))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --- VEHICLES ---
CREATE TABLE vehicles (
    id INT AUTO_INCREMENT,
    plate_number VARCHAR(20) NOT NULL,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INT NULL,
    color VARCHAR(50) NULL,
    chassis_number VARCHAR(100) NULL,
    engine_number VARCHAR(100) NULL,
    fuel_type ENUM('Petrol', 'Diesel', 'Electric', 'Hybrid') NOT NULL DEFAULT 'Diesel',
    fuel_capacity DECIMAL(10, 2) NULL,
    odometer_reading DECIMAL(10, 2) NOT NULL DEFAULT 0,
    operational_status ENUM('Available', 'In Use', 'Maintenance', 'Retired', 'On Trip') NOT NULL DEFAULT 'Available',
    purchase_date DATE NULL,
    purchase_cost DECIMAL(15, 2) NULL,
    supplier VARCHAR(255) NULL,
    last_service_date DATE NULL,
    next_service_due_date DATE NULL,
    registration_expiry_date DATE NULL,
    insurance_expiry_date DATE NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_vehicles_plate_number (plate_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --- DRIVERS ---
CREATE TABLE drivers (
    id INT AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    license_number VARCHAR(50) NOT NULL,
    license_expiry_date DATE NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NULL,
    address TEXT NULL,
    emergency_contact_name VARCHAR(255) NULL,
    emergency_contact_phone VARCHAR(20) NULL,
    status ENUM('Active', 'Inactive', 'Suspended', 'On Leave') NOT NULL DEFAULT 'Active',
    hire_date DATE NULL,
    performance_rating DECIMAL(3, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_drivers_license_number (license_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --- BOOKINGS ---
CREATE TABLE bookings (
    id INT AUTO_INCREMENT,
    request_id VARCHAR(50) NOT NULL,
    user_id INT NOT NULL,
    vehicle_id INT NULL,
    driver_id INT NULL,
    purpose TEXT NOT NULL,
    destination VARCHAR(255) NOT NULL,
    origin VARCHAR(255) NOT NULL DEFAULT 'Uganda Christian University Main Campus',
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    passengers INT NOT NULL DEFAULT 1,
    additional_notes TEXT NULL,
    status ENUM('Pending', 'Approved', 'Rejected', 'Cancelled', 'Completed') NOT NULL DEFAULT 'Pending',
    approved_by INT NULL,
    approved_at TIMESTAMP NULL DEFAULT NULL,
    rejection_reason TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_bookings_request_id (request_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --- TRIPS ---
CREATE TABLE trips (
    id INT AUTO_INCREMENT,
    booking_id INT NULL,
    vehicle_id INT NOT NULL,
    driver_id INT NOT NULL,
    origin VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    scheduled_departure DATETIME NULL,
    scheduled_arrival DATETIME NULL,
    actual_departure DATETIME NULL,
    actual_arrival DATETIME NULL,
    start_odometer DECIMAL(10, 2) NULL,
    end_odometer DECIMAL(10, 2) NULL,
    distance_traveled DECIMAL(10, 2) NULL,
    status ENUM('Pending', 'In Progress', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Pending',
    driver_notes TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --- FUEL LOGS ---
CREATE TABLE fuel_logs (
    id INT AUTO_INCREMENT,
    vehicle_id INT NOT NULL,
    fuel_type ENUM('Petrol', 'Diesel', 'Electric', 'Hybrid') NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    cost DECIMAL(15, 2) NOT NULL,
    odometer_reading DECIMAL(10, 2) NOT NULL,
    fuel_station VARCHAR(255) NULL,
    receipt_number VARCHAR(100) NULL,
    refuel_date DATE NOT NULL,
    efficiency DECIMAL(5, 2) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --- MAINTENANCE RECORDS ---
CREATE TABLE maintenance_records (
    id INT AUTO_INCREMENT,
    vehicle_id INT NOT NULL,
    service_type VARCHAR(100) NOT NULL,
    service_date DATE NOT NULL,
    odometer_reading DECIMAL(10, 2) NULL,
    cost DECIMAL(15, 2) NULL,
    mechanic_name VARCHAR(255) NULL,
    mechanic_details TEXT NULL,
    description TEXT NULL,
    next_service_due_date DATE NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --- ROUTES ---
CREATE TABLE routes (
    id INT AUTO_INCREMENT,
    name VARCHAR(255) NULL,
    origin VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    vehicle_id INT NULL,
    driver_id INT NULL,
    estimated_distance DECIMAL(10, 2) NULL,
    estimated_time VARCHAR(50) NULL,
    optimized_path TEXT NULL,
    status ENUM('Scheduled', 'In Progress', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Scheduled',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --- INCIDENTS ---
CREATE TABLE incidents (
    id INT AUTO_INCREMENT,
    incident_type ENUM('Accident', 'Breakdown', 'Theft', 'Vandalism', 'Minor Damage', 'Other') NOT NULL,
    vehicle_id INT NULL,
    driver_id INT NULL,
    reported_by INT NOT NULL,
    incident_date DATE NOT NULL,
    location VARCHAR(255) NOT NULL,
    description TEXT NULL,
    severity ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL DEFAULT 'Low',
    status ENUM('Reported', 'Under Investigation', 'Repair Scheduled', 'Resolved', 'Closed') NOT NULL DEFAULT 'Reported',
    damage_description TEXT NULL,
    estimated_repair_cost DECIMAL(15, 2) NULL,
    resolution_notes TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --- COMPLIANCE RECORDS ---
CREATE TABLE compliance_records (
    id INT AUTO_INCREMENT,
    vehicle_id INT NULL,
    driver_id INT NULL,
    regulation_type ENUM('Roadworthiness Certificate', 'Insurance', 'Driver License', 'Vehicle Registration', 'Other') NOT NULL,
    inspection_date DATE NOT NULL,
    expiry_date DATE NULL,
    inspector_name VARCHAR(255) NULL,
    compliance_status ENUM('Compliant', 'Non-Compliant', 'Expiring Soon') NOT NULL DEFAULT 'Compliant',
    findings TEXT NULL,
    next_inspection_date DATE NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --- DRIVER TRAINING ---
CREATE TABLE driver_training (
    id INT AUTO_INCREMENT,
    driver_id INT NOT NULL,
    training_type VARCHAR(100) NOT NULL,
    training_date DATE NOT NULL,
    trainer_name VARCHAR(255) NULL,
    location VARCHAR(255) NULL,
    duration_hours DECIMAL(5, 2) NULL,
    status ENUM('Scheduled', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Scheduled',
    certificate_number VARCHAR(100) NULL,
    notes TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --- ACTIVITY LOGS ---
CREATE TABLE activity_logs (
    id INT AUTO_INCREMENT,
    user_id INT NULL,
    vehicle_id INT NULL,
    driver_id INT NULL,
    booking_id INT NULL,
    activity_type VARCHAR(100) NOT NULL,
    description TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. FOREIGN KEYS (explicit ON UPDATE RESTRICT matches InnoDB default)
-- -----------------------------------------------------------------------------

ALTER TABLE bookings
    ADD CONSTRAINT fk_bookings_user_id
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE ON UPDATE RESTRICT,
    ADD CONSTRAINT fk_bookings_vehicle_id
        FOREIGN KEY (vehicle_id) REFERENCES vehicles (id)
        ON DELETE SET NULL ON UPDATE RESTRICT,
    ADD CONSTRAINT fk_bookings_driver_id
        FOREIGN KEY (driver_id) REFERENCES drivers (id)
        ON DELETE SET NULL ON UPDATE RESTRICT,
    ADD CONSTRAINT fk_bookings_approved_by
        FOREIGN KEY (approved_by) REFERENCES users (id)
        ON DELETE SET NULL ON UPDATE RESTRICT;

ALTER TABLE trips
    ADD CONSTRAINT fk_trips_booking_id
        FOREIGN KEY (booking_id) REFERENCES bookings (id)
        ON DELETE SET NULL ON UPDATE RESTRICT,
    ADD CONSTRAINT fk_trips_vehicle_id
        FOREIGN KEY (vehicle_id) REFERENCES vehicles (id)
        ON DELETE CASCADE ON UPDATE RESTRICT,
    ADD CONSTRAINT fk_trips_driver_id
        FOREIGN KEY (driver_id) REFERENCES drivers (id)
        ON DELETE CASCADE ON UPDATE RESTRICT;

ALTER TABLE fuel_logs
    ADD CONSTRAINT fk_fuel_logs_vehicle_id
        FOREIGN KEY (vehicle_id) REFERENCES vehicles (id)
        ON DELETE CASCADE ON UPDATE RESTRICT;

ALTER TABLE maintenance_records
    ADD CONSTRAINT fk_maintenance_records_vehicle_id
        FOREIGN KEY (vehicle_id) REFERENCES vehicles (id)
        ON DELETE CASCADE ON UPDATE RESTRICT;

ALTER TABLE routes
    ADD CONSTRAINT fk_routes_vehicle_id
        FOREIGN KEY (vehicle_id) REFERENCES vehicles (id)
        ON DELETE SET NULL ON UPDATE RESTRICT,
    ADD CONSTRAINT fk_routes_driver_id
        FOREIGN KEY (driver_id) REFERENCES drivers (id)
        ON DELETE SET NULL ON UPDATE RESTRICT;

ALTER TABLE incidents
    ADD CONSTRAINT fk_incidents_vehicle_id
        FOREIGN KEY (vehicle_id) REFERENCES vehicles (id)
        ON DELETE SET NULL ON UPDATE RESTRICT,
    ADD CONSTRAINT fk_incidents_driver_id
        FOREIGN KEY (driver_id) REFERENCES drivers (id)
        ON DELETE SET NULL ON UPDATE RESTRICT,
    ADD CONSTRAINT fk_incidents_reported_by
        FOREIGN KEY (reported_by) REFERENCES users (id)
        ON DELETE CASCADE ON UPDATE RESTRICT;

ALTER TABLE compliance_records
    ADD CONSTRAINT fk_compliance_vehicle_id
        FOREIGN KEY (vehicle_id) REFERENCES vehicles (id)
        ON DELETE CASCADE ON UPDATE RESTRICT,
    ADD CONSTRAINT fk_compliance_driver_id
        FOREIGN KEY (driver_id) REFERENCES drivers (id)
        ON DELETE CASCADE ON UPDATE RESTRICT;

ALTER TABLE driver_training
    ADD CONSTRAINT fk_driver_training_driver_id
        FOREIGN KEY (driver_id) REFERENCES drivers (id)
        ON DELETE CASCADE ON UPDATE RESTRICT;

ALTER TABLE activity_logs
    ADD CONSTRAINT fk_activity_logs_user_id
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE SET NULL ON UPDATE RESTRICT,
    ADD CONSTRAINT fk_activity_logs_vehicle_id
        FOREIGN KEY (vehicle_id) REFERENCES vehicles (id)
        ON DELETE SET NULL ON UPDATE RESTRICT,
    ADD CONSTRAINT fk_activity_logs_driver_id
        FOREIGN KEY (driver_id) REFERENCES drivers (id)
        ON DELETE SET NULL ON UPDATE RESTRICT,
    ADD CONSTRAINT fk_activity_logs_booking_id
        FOREIGN KEY (booking_id) REFERENCES bookings (id)
        ON DELETE SET NULL ON UPDATE RESTRICT;

-- -----------------------------------------------------------------------------
-- 4. INDEXES (non-unique; UNIQUE columns already indexed via uk_* above)
-- -----------------------------------------------------------------------------

CREATE INDEX idx_users_role ON users (role);

CREATE INDEX idx_vehicles_operational_status ON vehicles (operational_status);
CREATE INDEX idx_vehicles_fuel_type ON vehicles (fuel_type);

CREATE INDEX idx_drivers_status ON drivers (status);
CREATE INDEX idx_drivers_email ON drivers (email);

CREATE INDEX idx_bookings_user_id ON bookings (user_id);
CREATE INDEX idx_bookings_vehicle_id ON bookings (vehicle_id);
CREATE INDEX idx_bookings_driver_id ON bookings (driver_id);
CREATE INDEX idx_bookings_status ON bookings (status);
CREATE INDEX idx_bookings_start_date ON bookings (start_date);
CREATE INDEX idx_bookings_end_date ON bookings (end_date);

CREATE INDEX idx_trips_booking_id ON trips (booking_id);
CREATE INDEX idx_trips_vehicle_id ON trips (vehicle_id);
CREATE INDEX idx_trips_driver_id ON trips (driver_id);
CREATE INDEX idx_trips_status ON trips (status);
CREATE INDEX idx_trips_scheduled_departure ON trips (scheduled_departure);

CREATE INDEX idx_fuel_logs_vehicle_id ON fuel_logs (vehicle_id);
CREATE INDEX idx_fuel_logs_refuel_date ON fuel_logs (refuel_date);
CREATE INDEX idx_fuel_logs_fuel_type ON fuel_logs (fuel_type);

CREATE INDEX idx_maintenance_vehicle_id ON maintenance_records (vehicle_id);
CREATE INDEX idx_maintenance_service_date ON maintenance_records (service_date);
CREATE INDEX idx_maintenance_service_type ON maintenance_records (service_type);
CREATE INDEX idx_maintenance_next_service_due ON maintenance_records (next_service_due_date);

CREATE INDEX idx_routes_vehicle_id ON routes (vehicle_id);
CREATE INDEX idx_routes_driver_id ON routes (driver_id);
CREATE INDEX idx_routes_status ON routes (status);

CREATE INDEX idx_incidents_vehicle_id ON incidents (vehicle_id);
CREATE INDEX idx_incidents_driver_id ON incidents (driver_id);
CREATE INDEX idx_incidents_incident_type ON incidents (incident_type);
CREATE INDEX idx_incidents_severity ON incidents (severity);
CREATE INDEX idx_incidents_status ON incidents (status);
CREATE INDEX idx_incidents_incident_date ON incidents (incident_date);

CREATE INDEX idx_compliance_vehicle_id ON compliance_records (vehicle_id);
CREATE INDEX idx_compliance_driver_id ON compliance_records (driver_id);
CREATE INDEX idx_compliance_regulation_type ON compliance_records (regulation_type);
CREATE INDEX idx_compliance_compliance_status ON compliance_records (compliance_status);
CREATE INDEX idx_compliance_expiry_date ON compliance_records (expiry_date);

CREATE INDEX idx_driver_training_driver_id ON driver_training (driver_id);
CREATE INDEX idx_driver_training_training_date ON driver_training (training_date);
CREATE INDEX idx_driver_training_status ON driver_training (status);

CREATE INDEX idx_activity_logs_user_id ON activity_logs (user_id);
CREATE INDEX idx_activity_logs_vehicle_id ON activity_logs (vehicle_id);
CREATE INDEX idx_activity_logs_activity_type ON activity_logs (activity_type);
CREATE INDEX idx_activity_logs_created_at ON activity_logs (created_at);

-- -----------------------------------------------------------------------------
-- 5. ADVANCED OBJECTS
-- -----------------------------------------------------------------------------
-- (none defined in repository)

-- -----------------------------------------------------------------------------
-- 6. SAMPLE DATA (optional; bcrypt hash below is for the string "password" — replace in production)
-- -----------------------------------------------------------------------------
-- Same logical seed as database/initDatabase.js (passwords differ there: masai123 / client123).
-- To match initDatabase, run that script after schema, or replace hashes with your bcrypt output.

INSERT INTO users (username, email, password, name, role, phone, status) VALUES
(
    'masai',
    'masai.absalom@ucu.ac.ug',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Masai',
    'admin',
    NULL,
    'active'
),
(
    'client@ucu.ac.ug',
    'client@ucu.ac.ug',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Client User',
    'client',
    NULL,
    'active'
)
ON DUPLICATE KEY UPDATE username = VALUES(username);

INSERT INTO drivers (name, license_number, phone, email, status) VALUES
('Masai', 'DL-001', '+256 700 000 001', 'masai.absalom@ucu.ac.ug', 'Active'),
('Patrick', 'DL-002', '+256 700 000 002', 'patrick@ucu.ac.ug', 'Active'),
('Kasimu', 'DL-003', '+256 700 000 003', 'kasimu@ucu.ac.ug', 'Active')
ON DUPLICATE KEY UPDATE license_number = VALUES(license_number);

-- -----------------------------------------------------------------------------
-- 7. VALIDATION NOTES
-- -----------------------------------------------------------------------------
-- * Table order: users, vehicles, drivers → bookings → trips → dependents → activity_logs
-- * No circular FKs: activity_logs references bookings; bookings does not reference activity_logs
-- * Re-run on non-empty DB: DROP DATABASE or drop tables in reverse FK order before CREATE
-- =============================================================================
