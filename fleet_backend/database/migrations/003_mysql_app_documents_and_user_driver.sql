-- Run once on your MySQL database (after base schema from schema.sql or full rebuild).
-- If you see "Duplicate column name 'driver_id'", skip the ALTER line.

CREATE TABLE IF NOT EXISTS app_documents (
  collection VARCHAR(64) NOT NULL,
  doc_id VARCHAR(64) NOT NULL,
  payload LONGTEXT NOT NULL,
  updated_at DATETIME NULL,
  PRIMARY KEY (collection, doc_id),
  KEY idx_app_documents_collection (collection)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE users ADD COLUMN driver_id INT NULL;
