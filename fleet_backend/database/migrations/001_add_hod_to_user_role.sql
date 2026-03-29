-- Run once on existing MySQL databases created before HOD role was added.
-- If you see "Duplicate column" or similar, adjust for your live schema.

ALTER TABLE users
  MODIFY COLUMN role ENUM('admin', 'client', 'driver', 'hod', 'fleet_manager') DEFAULT 'client';
