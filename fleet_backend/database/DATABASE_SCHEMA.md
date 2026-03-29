# UCU Fleet Management — MySQL schema reference

This document describes the **canonical** relational schema defined in [`schema.sql`](./schema.sql). Types, nullability, defaults, and constraints match that file exactly. Storage engine: **InnoDB**; charset **utf8mb4**; collation **utf8mb4_unicode_ci**; database name **`ucu_fleet_management`**.

---

## Database

| Setting        | Value |
|----------------|--------|
| Database name  | `ucu_fleet_management` |
| Character set  | `utf8mb4` |
| Collation      | `utf8mb4_unicode_ci` |

---

## Entity: `users`

| Attribute   | Data type | Null | Default | Constraints |
|-------------|-----------|------|---------|-------------|
| `id` | `INT` | NO | `AUTO_INCREMENT` | `PRIMARY KEY` |
| `username` | `VARCHAR(100)` | NO | — | `UNIQUE`, `NOT NULL`; index `idx_username (username)` |
| `email` | `VARCHAR(255)` | NO | — | `UNIQUE`, `NOT NULL`; index `idx_email (email)` |
| `password` | `VARCHAR(255)` | NO | — | `NOT NULL` |
| `name` | `VARCHAR(255)` | NO | — | `NOT NULL` |
| `role` | `ENUM('admin', 'client', 'driver', 'hod', 'fleet_manager')` | YES | `'client'` | index `idx_role (role)` |
| `phone` | `VARCHAR(20)` | YES | — | — |
| `status` | `ENUM('active', 'inactive', 'suspended')` | YES | `'active'` | — |
| `created_at` | `TIMESTAMP` | YES | `CURRENT_TIMESTAMP` | — |
| `updated_at` | `TIMESTAMP` | YES | `CURRENT_TIMESTAMP` | `ON UPDATE CURRENT_TIMESTAMP` |

**Indexes (non-primary):** `idx_username (username)`, `idx_email (email)`, `idx_role (role)`.

---

## Entity: `vehicles`

| Attribute | Data type | Null | Default | Constraints |
|-----------|-----------|------|---------|-------------|
| `id` | `INT` | NO | `AUTO_INCREMENT` | `PRIMARY KEY` |
| `plate_number` | `VARCHAR(20)` | NO | — | `UNIQUE`, `NOT NULL`; index `idx_plate_number (plate_number)` |
| `make` | `VARCHAR(100)` | NO | — | `NOT NULL` |
| `model` | `VARCHAR(100)` | NO | — | `NOT NULL` |
| `year` | `INT` | YES | — | — |
| `color` | `VARCHAR(50)` | YES | — | — |
| `chassis_number` | `VARCHAR(100)` | YES | — | — |
| `engine_number` | `VARCHAR(100)` | YES | — | — |
| `fuel_type` | `ENUM('Petrol', 'Diesel', 'Electric', 'Hybrid')` | YES | `'Diesel'` | index `idx_fuel_type (fuel_type)` |
| `fuel_capacity` | `DECIMAL(10, 2)` | YES | — | — |
| `odometer_reading` | `DECIMAL(10, 2)` | YES | `0` | — |
| `operational_status` | `ENUM('Available', 'In Use', 'Maintenance', 'Retired', 'On Trip')` | YES | `'Available'` | index `idx_operational_status (operational_status)` |
| `purchase_date` | `DATE` | YES | — | — |
| `purchase_cost` | `DECIMAL(15, 2)` | YES | — | — |
| `supplier` | `VARCHAR(255)` | YES | — | — |
| `last_service_date` | `DATE` | YES | — | — |
| `next_service_due_date` | `DATE` | YES | — | — |
| `registration_expiry_date` | `DATE` | YES | — | — |
| `insurance_expiry_date` | `DATE` | YES | — | — |
| `created_at` | `TIMESTAMP` | YES | `CURRENT_TIMESTAMP` | — |
| `updated_at` | `TIMESTAMP` | YES | `CURRENT_TIMESTAMP` | `ON UPDATE CURRENT_TIMESTAMP` |

**Indexes (non-primary):** `idx_plate_number (plate_number)`, `idx_operational_status (operational_status)`, `idx_fuel_type (fuel_type)`.

---

## Entity: `drivers`

| Attribute | Data type | Null | Default | Constraints |
|-----------|-----------|------|---------|-------------|
| `id` | `INT` | NO | `AUTO_INCREMENT` | `PRIMARY KEY` |
| `name` | `VARCHAR(255)` | NO | — | `NOT NULL` |
| `license_number` | `VARCHAR(50)` | NO | — | `UNIQUE`, `NOT NULL`; index `idx_license_number (license_number)` |
| `license_expiry_date` | `DATE` | YES | — | — |
| `phone` | `VARCHAR(20)` | NO | — | `NOT NULL` |
| `email` | `VARCHAR(255)` | YES | — | index `idx_email (email)` |
| `address` | `TEXT` | YES | — | — |
| `emergency_contact_name` | `VARCHAR(255)` | YES | — | — |
| `emergency_contact_phone` | `VARCHAR(20)` | YES | — | — |
| `status` | `ENUM('Active', 'Inactive', 'Suspended', 'On Leave')` | YES | `'Active'` | index `idx_status (status)` |
| `hire_date` | `DATE` | YES | — | — |
| `performance_rating` | `DECIMAL(3, 2)` | YES | `0.00` | — |
| `created_at` | `TIMESTAMP` | YES | `CURRENT_TIMESTAMP` | — |
| `updated_at` | `TIMESTAMP` | YES | `CURRENT_TIMESTAMP` | `ON UPDATE CURRENT_TIMESTAMP` |

**Indexes (non-primary):** `idx_license_number (license_number)`, `idx_status (status)`, `idx_email (email)`.

---

## Entity: `bookings`

| Attribute | Data type | Null | Default | Constraints |
|-----------|-----------|------|---------|-------------|
| `id` | `INT` | NO | `AUTO_INCREMENT` | `PRIMARY KEY` |
| `request_id` | `VARCHAR(50)` | NO | — | `UNIQUE`, `NOT NULL`; index `idx_request_id (request_id)` |
| `user_id` | `INT` | NO | — | `NOT NULL`; `FOREIGN KEY` → `users(id)` **`ON DELETE CASCADE`**; index `idx_user_id (user_id)` |
| `vehicle_id` | `INT` | YES | — | `FOREIGN KEY` → `vehicles(id)` **`ON DELETE SET NULL`**; index `idx_vehicle_id (vehicle_id)` |
| `driver_id` | `INT` | YES | — | `FOREIGN KEY` → `drivers(id)` **`ON DELETE SET NULL`**; index `idx_driver_id (driver_id)` |
| `purpose` | `TEXT` | NO | — | `NOT NULL` |
| `destination` | `VARCHAR(255)` | NO | — | `NOT NULL` |
| `origin` | `VARCHAR(255)` | YES | `'Uganda Christian University Main Campus'` | — |
| `start_date` | `DATETIME` | NO | — | `NOT NULL`; index `idx_start_date (start_date)` |
| `end_date` | `DATETIME` | NO | — | `NOT NULL`; index `idx_end_date (end_date)` |
| `passengers` | `INT` | YES | `1` | — |
| `additional_notes` | `TEXT` | YES | — | — |
| `status` | `ENUM('Pending', 'Approved', 'Rejected', 'Cancelled', 'Completed')` | YES | `'Pending'` | index `idx_status (status)` |
| `approved_by` | `INT` | YES | — | `FOREIGN KEY` → `users(id)` **`ON DELETE SET NULL`** |
| `approved_at` | `TIMESTAMP` | YES | `NULL` | explicit `NULL` default in DDL |
| `rejection_reason` | `TEXT` | YES | — | — |
| `created_at` | `TIMESTAMP` | YES | `CURRENT_TIMESTAMP` | — |
| `updated_at` | `TIMESTAMP` | YES | `CURRENT_TIMESTAMP` | `ON UPDATE CURRENT_TIMESTAMP` |

**Indexes (non-primary):** `idx_request_id`, `idx_user_id`, `idx_vehicle_id`, `idx_driver_id`, `idx_status`, `idx_start_date`, `idx_end_date`.

---

## Entity: `trips`

| Attribute | Data type | Null | Default | Constraints |
|-----------|-----------|------|---------|-------------|
| `id` | `INT` | NO | `AUTO_INCREMENT` | `PRIMARY KEY` |
| `booking_id` | `INT` | YES | — | `FOREIGN KEY` → `bookings(id)` **`ON DELETE SET NULL`**; index `idx_booking_id (booking_id)` |
| `vehicle_id` | `INT` | NO | — | `NOT NULL`; `FOREIGN KEY` → `vehicles(id)` **`ON DELETE CASCADE`**; index `idx_vehicle_id (vehicle_id)` |
| `driver_id` | `INT` | NO | — | `NOT NULL`; `FOREIGN KEY` → `drivers(id)` **`ON DELETE CASCADE`**; index `idx_driver_id (driver_id)` |
| `origin` | `VARCHAR(255)` | NO | — | `NOT NULL` |
| `destination` | `VARCHAR(255)` | NO | — | `NOT NULL` |
| `scheduled_departure` | `DATETIME` | YES | — | index `idx_scheduled_departure (scheduled_departure)` |
| `scheduled_arrival` | `DATETIME` | YES | — | — |
| `actual_departure` | `DATETIME` | YES | — | — |
| `actual_arrival` | `DATETIME` | YES | — | — |
| `start_odometer` | `DECIMAL(10, 2)` | YES | — | — |
| `end_odometer` | `DECIMAL(10, 2)` | YES | — | — |
| `distance_traveled` | `DECIMAL(10, 2)` | YES | — | — |
| `status` | `ENUM('Pending', 'In Progress', 'Completed', 'Cancelled')` | YES | `'Pending'` | index `idx_status (status)` |
| `driver_notes` | `TEXT` | YES | — | — |
| `created_at` | `TIMESTAMP` | YES | `CURRENT_TIMESTAMP` | — |
| `updated_at` | `TIMESTAMP` | YES | `CURRENT_TIMESTAMP` | `ON UPDATE CURRENT_TIMESTAMP` |

**Indexes (non-primary):** `idx_booking_id`, `idx_vehicle_id`, `idx_driver_id`, `idx_status`, `idx_scheduled_departure`.

---

## Entity: `fuel_logs`

| Attribute | Data type | Null | Default | Constraints |
|-----------|-----------|------|---------|-------------|
| `id` | `INT` | NO | `AUTO_INCREMENT` | `PRIMARY KEY` |
| `vehicle_id` | `INT` | NO | — | `NOT NULL`; `FOREIGN KEY` → `vehicles(id)` **`ON DELETE CASCADE`**; index `idx_vehicle_id (vehicle_id)` |
| `fuel_type` | `ENUM('Petrol', 'Diesel', 'Electric', 'Hybrid')` | NO | — | `NOT NULL`; index `idx_fuel_type (fuel_type)` |
| `quantity` | `DECIMAL(10, 2)` | NO | — | `NOT NULL` |
| `cost` | `DECIMAL(15, 2)` | NO | — | `NOT NULL` |
| `odometer_reading` | `DECIMAL(10, 2)` | NO | — | `NOT NULL` |
| `fuel_station` | `VARCHAR(255)` | YES | — | — |
| `receipt_number` | `VARCHAR(100)` | YES | — | — |
| `refuel_date` | `DATE` | NO | — | `NOT NULL`; index `idx_refuel_date (refuel_date)` |
| `efficiency` | `DECIMAL(5, 2)` | YES | — | — |
| `created_at` | `TIMESTAMP` | YES | `CURRENT_TIMESTAMP` | — |

**Indexes (non-primary):** `idx_vehicle_id`, `idx_refuel_date`, `idx_fuel_type`.

---

## Entity: `maintenance_records`

| Attribute | Data type | Null | Default | Constraints |
|-----------|-----------|------|---------|-------------|
| `id` | `INT` | NO | `AUTO_INCREMENT` | `PRIMARY KEY` |
| `vehicle_id` | `INT` | NO | — | `NOT NULL`; `FOREIGN KEY` → `vehicles(id)` **`ON DELETE CASCADE`**; index `idx_vehicle_id (vehicle_id)` |
| `service_type` | `VARCHAR(100)` | NO | — | `NOT NULL`; index `idx_service_type (service_type)` |
| `service_date` | `DATE` | NO | — | `NOT NULL`; index `idx_service_date (service_date)` |
| `odometer_reading` | `DECIMAL(10, 2)` | YES | — | — |
| `cost` | `DECIMAL(15, 2)` | YES | — | — |
| `mechanic_name` | `VARCHAR(255)` | YES | — | — |
| `mechanic_details` | `TEXT` | YES | — | — |
| `description` | `TEXT` | YES | — | — |
| `next_service_due_date` | `DATE` | YES | — | index `idx_next_service_due (next_service_due_date)` |
| `created_at` | `TIMESTAMP` | YES | `CURRENT_TIMESTAMP` | — |
| `updated_at` | `TIMESTAMP` | YES | `CURRENT_TIMESTAMP` | `ON UPDATE CURRENT_TIMESTAMP` |

**Indexes (non-primary):** `idx_vehicle_id`, `idx_service_date`, `idx_service_type`, `idx_next_service_due`.

---

## Entity: `routes`

| Attribute | Data type | Null | Default | Constraints |
|-----------|-----------|------|---------|-------------|
| `id` | `INT` | NO | `AUTO_INCREMENT` | `PRIMARY KEY` |
| `name` | `VARCHAR(255)` | YES | — | — |
| `origin` | `VARCHAR(255)` | NO | — | `NOT NULL` |
| `destination` | `VARCHAR(255)` | NO | — | `NOT NULL` |
| `vehicle_id` | `INT` | YES | — | `FOREIGN KEY` → `vehicles(id)` **`ON DELETE SET NULL`**; index `idx_vehicle_id (vehicle_id)` |
| `driver_id` | `INT` | YES | — | `FOREIGN KEY` → `drivers(id)` **`ON DELETE SET NULL`**; index `idx_driver_id (driver_id)` |
| `estimated_distance` | `DECIMAL(10, 2)` | YES | — | — |
| `estimated_time` | `VARCHAR(50)` | YES | — | — |
| `optimized_path` | `TEXT` | YES | — | — |
| `status` | `ENUM('Scheduled', 'In Progress', 'Completed', 'Cancelled')` | YES | `'Scheduled'` | index `idx_status (status)` |
| `created_at` | `TIMESTAMP` | YES | `CURRENT_TIMESTAMP` | — |
| `updated_at` | `TIMESTAMP` | YES | `CURRENT_TIMESTAMP` | `ON UPDATE CURRENT_TIMESTAMP` |

**Indexes (non-primary):** `idx_vehicle_id`, `idx_driver_id`, `idx_status`.

---

## Entity: `incidents`

| Attribute | Data type | Null | Default | Constraints |
|-----------|-----------|------|---------|-------------|
| `id` | `INT` | NO | `AUTO_INCREMENT` | `PRIMARY KEY` |
| `incident_type` | `ENUM('Accident', 'Breakdown', 'Theft', 'Vandalism', 'Minor Damage', 'Other')` | NO | — | `NOT NULL`; index `idx_incident_type (incident_type)` |
| `vehicle_id` | `INT` | YES | — | `FOREIGN KEY` → `vehicles(id)` **`ON DELETE SET NULL`**; index `idx_vehicle_id (vehicle_id)` |
| `driver_id` | `INT` | YES | — | `FOREIGN KEY` → `drivers(id)` **`ON DELETE SET NULL`**; index `idx_driver_id (driver_id)` |
| `reported_by` | `INT` | NO | — | `NOT NULL`; `FOREIGN KEY` → `users(id)` **`ON DELETE CASCADE`** |
| `incident_date` | `DATE` | NO | — | `NOT NULL`; index `idx_incident_date (incident_date)` |
| `location` | `VARCHAR(255)` | NO | — | `NOT NULL` |
| `description` | `TEXT` | YES | — | — |
| `severity` | `ENUM('Low', 'Medium', 'High', 'Critical')` | YES | `'Low'` | index `idx_severity (severity)` |
| `status` | `ENUM('Reported', 'Under Investigation', 'Repair Scheduled', 'Resolved', 'Closed')` | YES | `'Reported'` | index `idx_status (status)` |
| `damage_description` | `TEXT` | YES | — | — |
| `estimated_repair_cost` | `DECIMAL(15, 2)` | YES | — | — |
| `resolution_notes` | `TEXT` | YES | — | — |
| `created_at` | `TIMESTAMP` | YES | `CURRENT_TIMESTAMP` | — |
| `updated_at` | `TIMESTAMP` | YES | `CURRENT_TIMESTAMP` | `ON UPDATE CURRENT_TIMESTAMP` |

**Indexes (non-primary):** `idx_vehicle_id`, `idx_driver_id`, `idx_incident_type`, `idx_severity`, `idx_status`, `idx_incident_date`.

---

## Entity: `compliance_records`

| Attribute | Data type | Null | Default | Constraints |
|-----------|-----------|------|---------|-------------|
| `id` | `INT` | NO | `AUTO_INCREMENT` | `PRIMARY KEY` |
| `vehicle_id` | `INT` | YES | — | `FOREIGN KEY` → `vehicles(id)` **`ON DELETE CASCADE`**; index `idx_vehicle_id (vehicle_id)` |
| `driver_id` | `INT` | YES | — | `FOREIGN KEY` → `drivers(id)` **`ON DELETE CASCADE`**; index `idx_driver_id (driver_id)` |
| `regulation_type` | `ENUM('Roadworthiness Certificate', 'Insurance', 'Driver License', 'Vehicle Registration', 'Other')` | NO | — | `NOT NULL`; index `idx_regulation_type (regulation_type)` |
| `inspection_date` | `DATE` | NO | — | `NOT NULL` |
| `expiry_date` | `DATE` | YES | — | index `idx_expiry_date (expiry_date)` |
| `inspector_name` | `VARCHAR(255)` | YES | — | — |
| `compliance_status` | `ENUM('Compliant', 'Non-Compliant', 'Expiring Soon')` | YES | `'Compliant'` | index `idx_compliance_status (compliance_status)` |
| `findings` | `TEXT` | YES | — | — |
| `next_inspection_date` | `DATE` | YES | — | — |
| `created_at` | `TIMESTAMP` | YES | `CURRENT_TIMESTAMP` | — |
| `updated_at` | `TIMESTAMP` | YES | `CURRENT_TIMESTAMP` | `ON UPDATE CURRENT_TIMESTAMP` |

**Indexes (non-primary):** `idx_vehicle_id`, `idx_driver_id`, `idx_regulation_type`, `idx_compliance_status`, `idx_expiry_date`.

---

## Entity: `driver_training`

| Attribute | Data type | Null | Default | Constraints |
|-----------|-----------|------|---------|-------------|
| `id` | `INT` | NO | `AUTO_INCREMENT` | `PRIMARY KEY` |
| `driver_id` | `INT` | NO | — | `NOT NULL`; `FOREIGN KEY` → `drivers(id)` **`ON DELETE CASCADE`**; index `idx_driver_id (driver_id)` |
| `training_type` | `VARCHAR(100)` | NO | — | `NOT NULL` |
| `training_date` | `DATE` | NO | — | `NOT NULL`; index `idx_training_date (training_date)` |
| `trainer_name` | `VARCHAR(255)` | YES | — | — |
| `location` | `VARCHAR(255)` | YES | — | — |
| `duration_hours` | `DECIMAL(5, 2)` | YES | — | — |
| `status` | `ENUM('Scheduled', 'Completed', 'Cancelled')` | YES | `'Scheduled'` | index `idx_status (status)` |
| `certificate_number` | `VARCHAR(100)` | YES | — | — |
| `notes` | `TEXT` | YES | — | — |
| `created_at` | `TIMESTAMP` | YES | `CURRENT_TIMESTAMP` | — |
| `updated_at` | `TIMESTAMP` | YES | `CURRENT_TIMESTAMP` | `ON UPDATE CURRENT_TIMESTAMP` |

**Indexes (non-primary):** `idx_driver_id`, `idx_training_date`, `idx_status`.

---

## Entity: `activity_logs`

| Attribute | Data type | Null | Default | Constraints |
|-----------|-----------|------|---------|-------------|
| `id` | `INT` | NO | `AUTO_INCREMENT` | `PRIMARY KEY` |
| `user_id` | `INT` | YES | — | `FOREIGN KEY` → `users(id)` **`ON DELETE SET NULL`**; index `idx_user_id (user_id)` |
| `vehicle_id` | `INT` | YES | — | `FOREIGN KEY` → `vehicles(id)` **`ON DELETE SET NULL`**; index `idx_vehicle_id (vehicle_id)` |
| `driver_id` | `INT` | YES | — | `FOREIGN KEY` → `drivers(id)` **`ON DELETE SET NULL`** |
| `booking_id` | `INT` | YES | — | `FOREIGN KEY` → `bookings(id)` **`ON DELETE SET NULL`** |
| `activity_type` | `VARCHAR(100)` | NO | — | `NOT NULL`; index `idx_activity_type (activity_type)` |
| `description` | `TEXT` | YES | — | — |
| `created_at` | `TIMESTAMP` | YES | `CURRENT_TIMESTAMP` | index `idx_created_at (created_at)` |

**Indexes (non-primary):** `idx_user_id`, `idx_vehicle_id`, `idx_activity_type`, `idx_created_at`.

---

## Foreign key summary (from `schema.sql`)

| Child table | Column | Parent | Parent column | `ON DELETE` |
|-------------|--------|--------|---------------|-------------|
| `bookings` | `user_id` | `users` | `id` | `CASCADE` |
| `bookings` | `vehicle_id` | `vehicles` | `id` | `SET NULL` |
| `bookings` | `driver_id` | `drivers` | `id` | `SET NULL` |
| `bookings` | `approved_by` | `users` | `id` | `SET NULL` |
| `trips` | `booking_id` | `bookings` | `id` | `SET NULL` |
| `trips` | `vehicle_id` | `vehicles` | `id` | `CASCADE` |
| `trips` | `driver_id` | `drivers` | `id` | `CASCADE` |
| `fuel_logs` | `vehicle_id` | `vehicles` | `id` | `CASCADE` |
| `maintenance_records` | `vehicle_id` | `vehicles` | `id` | `CASCADE` |
| `routes` | `vehicle_id` | `vehicles` | `id` | `SET NULL` |
| `routes` | `driver_id` | `drivers` | `id` | `SET NULL` |
| `incidents` | `vehicle_id` | `vehicles` | `id` | `SET NULL` |
| `incidents` | `driver_id` | `drivers` | `id` | `SET NULL` |
| `incidents` | `reported_by` | `users` | `id` | `CASCADE` |
| `compliance_records` | `vehicle_id` | `vehicles` | `id` | `CASCADE` |
| `compliance_records` | `driver_id` | `drivers` | `id` | `CASCADE` |
| `driver_training` | `driver_id` | `drivers` | `id` | `CASCADE` |
| `activity_logs` | `user_id` | `users` | `id` | `SET NULL` |
| `activity_logs` | `vehicle_id` | `vehicles` | `id` | `SET NULL` |
| `activity_logs` | `driver_id` | `drivers` | `id` | `SET NULL` |
| `activity_logs` | `booking_id` | `bookings` | `id` | `SET NULL` |

`schema.sql` does not specify `ON UPDATE` on foreign keys; MySQL/InnoDB applies its default for updates to referenced keys.

---

## Seed data (from `schema.sql`)

- **`users`:** two rows (`masai` / admin, `client@ucu.ac.ug` / client); passwords are placeholders until replaced with real bcrypt hashes.
- **`drivers`:** three sample drivers (`DL-001` … `DL-003`).

Initialization with real password hashes is also performed by `fleet_backend/database/initDatabase.js`.

---

## Related files

| File | Purpose |
|------|---------|
| [`schema.sql`](./schema.sql) | Executable DDL |
| [`migrations/001_add_hod_to_user_role.sql`](./migrations/001_add_hod_to_user_role.sql) | Historical migration; `hod` is already in current `users.role` ENUM |
| [`ucu_fleet_management_full_rebuild.sql`](./ucu_fleet_management_full_rebuild.sql) | Alternative full script (indexes/FKs split out) |

Legacy alternate DDL (different table names such as `booking_requests`) lives in `fleet_backend/src/config/schema.sql` and is **not** the canonical schema for `initDatabase.js`.
