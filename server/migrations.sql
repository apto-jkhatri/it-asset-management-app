-- Run this SQL on your MySQL server (e.g., in MySQL Workbench or the mysql CLI)

CREATE DATABASE IF NOT EXISTS assetguard;
USE assetguard;

CREATE TABLE IF NOT EXISTS employees (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  department VARCHAR(255) NOT NULL,
  role VARCHAR(255) NOT NULL,
  joinDate VARCHAR(50) NOT NULL,
  avatar TEXT
);

CREATE TABLE IF NOT EXISTS assets (
  id VARCHAR(100) PRIMARY KEY,
  tag VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  serialNumber VARCHAR(255) NOT NULL,
  category VARCHAR(255) NOT NULL,
  vendor VARCHAR(255) NOT NULL,
  purchaseDate VARCHAR(50) NOT NULL,
  cost DECIMAL(12,2) NOT NULL,
  status VARCHAR(50) NOT NULL,
  `condition` VARCHAR(50) NOT NULL,
  location VARCHAR(255) NOT NULL,
  assignedTo VARCHAR(100),
  image TEXT,
  FOREIGN KEY (assignedTo) REFERENCES employees(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS assignments (
  id VARCHAR(100) PRIMARY KEY,
  assetId VARCHAR(100) NOT NULL,
  employeeId VARCHAR(100) NOT NULL,
  borrowDate VARCHAR(50) NOT NULL,
  expectedReturnDate VARCHAR(50),
  returnedDate VARCHAR(50),
  notes TEXT,
  isActive BOOLEAN NOT NULL DEFAULT TRUE,
  FOREIGN KEY (assetId) REFERENCES assets(id) ON DELETE CASCADE,
  FOREIGN KEY (employeeId) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS maintenance_logs (
  id VARCHAR(100) PRIMARY KEY,
  assetId VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  vendor VARCHAR(255) NOT NULL,
  cost DECIMAL(12,2) NOT NULL,
  date VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  FOREIGN KEY (assetId) REFERENCES assets(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS asset_requests (
  id VARCHAR(100) PRIMARY KEY,
  employeeId VARCHAR(100) NOT NULL,
  category VARCHAR(255) NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(50) NOT NULL,
  requestDate VARCHAR(50) NOT NULL,
  FOREIGN KEY (employeeId) REFERENCES employees(id) ON DELETE CASCADE
);
