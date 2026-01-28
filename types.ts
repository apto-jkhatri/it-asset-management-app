export enum AssetStatus {
  AVAILABLE = 'Available',
  ASSIGNED = 'Assigned',
  IN_REPAIR = 'In Repair',
  RETIRED = 'Retired',
  LOST = 'Lost',
  DAMAGED = 'Damaged'
}

export enum AssetCondition {
  NEW = 'New',
  GOOD = 'Good',
  FAIR = 'Fair',
  POOR = 'Poor',
  DAMAGED = 'Damaged'
}

export interface Asset {
  id: string;
  tag: string; // Asset Tag/Barcode
  name: string; // e.g. MacBook Pro 16
  serialNumber: string;
  category: string; // Laptop, Monitor, etc.
  vendor: string;
  purchaseDate: string;
  cost: number;
  status: AssetStatus;
  condition: AssetCondition;
  location: string;
  assignedTo?: string; // Employee ID
  image?: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  joinDate: string;
  avatar?: string;
}

export interface Assignment {
  id: string;
  assetId: string;
  employeeId: string;
  borrowDate: string;
  expectedReturnDate?: string;
  returnedDate?: string;
  notes?: string;
  isActive: boolean;
}

export interface MaintenanceLog {
  id: string;
  assetId: string;
  description: string;
  vendor: string;
  cost: number;
  date: string;
  status: 'In Progress' | 'Completed';
}

export interface AssetRequest {
  id: string;
  employeeId: string;
  category: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Closed';
  requestDate: string;
  userName?: string;
  userEmail?: string;
  requestIp?: string;
}