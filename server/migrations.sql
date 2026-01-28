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

-- New table for user authentication and management
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') DEFAULT 'user',
  employeeId VARCHAR(100),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employeeId) REFERENCES employees(id) ON DELETE SET NULL
);

-- New table for ticket chat/messages
CREATE TABLE IF NOT EXISTS ticket_messages (
  id VARCHAR(100) PRIMARY KEY,
  requestId VARCHAR(100) NOT NULL,
  senderId VARCHAR(100) NOT NULL,
  senderName VARCHAR(255),
  message TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (requestId) REFERENCES asset_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (senderId) REFERENCES users(id) ON DELETE CASCADE
);

-- New table to store additional request metadata (user info, IP) without altering asset_requests
CREATE TABLE IF NOT EXISTS request_metadata (
  id VARCHAR(100) PRIMARY KEY,
  requestId VARCHAR(100) UNIQUE NOT NULL,
  userId VARCHAR(100),
  userName VARCHAR(255),
  userEmail VARCHAR(255),
  requestIp VARCHAR(45),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (requestId) REFERENCES asset_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
);

-- Ensure default admin exists in employees table first to satisfy foreign keys
INSERT INTO employees (id, name, email, department, role, joinDate) 
VALUES ('EMP-ADMIN-001', 'System Administrator', 'admin@aptologics.com', 'IT', 'Administrator', '2024-01-01')
ON DUPLICATE KEY UPDATE id=id;

-- Seed data: Default admin user
INSERT INTO users (id, name, email, password, role, employeeId) VALUES 
  ('USR-ADMIN-001', 'System Administrator', 'admin@aptologics.com', 'admin123', 'admin', 'EMP-ADMIN-001')
ON DUPLICATE KEY UPDATE id=id;
