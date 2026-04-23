CREATE DATABASE IF NOT EXISTS farmacia_brasil
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE farmacia_brasil;

CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_name VARCHAR(180) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  items JSON NOT NULL,
  subtotal DECIMAL(10,2) NULL,
  payment_method VARCHAR(80) NOT NULL,
  change_amount VARCHAR(80) NULL,
  address_street VARCHAR(255) NOT NULL,
  address_number VARCHAR(60) NULL,
  address_district VARCHAR(120) NULL,
  address_zip VARCHAR(9) NULL,
  address_reference VARCHAR(255) NULL,
  address_block VARCHAR(80) NULL,
  address_apartment VARCHAR(80) NULL,
  notes TEXT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'novo',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
