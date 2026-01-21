import { PGlite } from '@electric-sql/pglite';
import { Asset, Employee, Assignment, MaintenanceLog, AssetRequest, AssetStatus, AssetCondition } from '../types';
import { INITIAL_ASSETS, INITIAL_EMPLOYEES, INITIAL_ASSIGNMENTS, INITIAL_MAINTENANCE, INITIAL_REQUESTS } from './mockData';

class DatabaseService {
  private pg: PGlite | null = null;
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    // Don't auto-initialize - lazy load instead
  }

  private async init() {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    // Use a persistent directory if in Electron, or IndexedDB in the browser
    this.initPromise = this._performInit();
    await this.initPromise;
  }

  private async _performInit() {
    this.pg = new PGlite('idb://assetguard_db');

    await this.pg.exec(`
      CREATE TABLE IF NOT EXISTS employees (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        department TEXT NOT NULL,
        role TEXT NOT NULL,
        joinDate TEXT NOT NULL,
        avatar TEXT
      );

      CREATE TABLE IF NOT EXISTS assets (
        id TEXT PRIMARY KEY,
        tag TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        serialNumber TEXT NOT NULL,
        category TEXT NOT NULL,
        vendor TEXT NOT NULL,
        purchaseDate TEXT NOT NULL,
        cost NUMERIC NOT NULL,
        status TEXT NOT NULL,
        condition TEXT NOT NULL,
        location TEXT NOT NULL,
        assignedTo TEXT REFERENCES employees(id),
        image TEXT
      );

      CREATE TABLE IF NOT EXISTS assignments (
        id TEXT PRIMARY KEY,
        assetId TEXT NOT NULL REFERENCES assets(id),
        employeeId TEXT NOT NULL REFERENCES employees(id),
        borrowDate TEXT NOT NULL,
        expectedReturnDate TEXT,
        returnedDate TEXT,
        notes TEXT,
        isActive BOOLEAN NOT NULL DEFAULT TRUE
      );

      CREATE TABLE IF NOT EXISTS maintenance_logs (
        id TEXT PRIMARY KEY,
        assetId TEXT NOT NULL REFERENCES assets(id),
        description TEXT NOT NULL,
        vendor TEXT NOT NULL,
        cost NUMERIC NOT NULL,
        date TEXT NOT NULL,
        status TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS asset_requests (
        id TEXT PRIMARY KEY,
        employeeId TEXT NOT NULL REFERENCES employees(id),
        category TEXT NOT NULL,
        reason TEXT NOT NULL,
        status TEXT NOT NULL,
        requestDate TEXT NOT NULL
      );
    `);

    // Seed data if employees table is empty
    const check = await this.pg.query('SELECT count(*) FROM employees');
    const firstRow = (check.rows[0] || {}) as any;
    const cnt = Number(firstRow.count ?? firstRow['count'] ?? Object.values(firstRow)[0] ?? 0);
    if (cnt === 0) {
      console.log('Seeding initial PostgreSQL data...');
      
      for (const e of INITIAL_EMPLOYEES) {
        await this.pg.query(
          'INSERT INTO employees (id, name, email, department, role, joinDate, avatar) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [e.id, e.name, e.email, e.department, e.role, e.joinDate, e.avatar]
        );
      }
      for (const a of INITIAL_ASSETS) {
        await this.pg.query(
          'INSERT INTO assets (id, tag, name, serialNumber, category, vendor, purchaseDate, cost, status, condition, location, assignedTo, image) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)',
          [a.id, a.tag, a.name, a.serialNumber, a.category, a.vendor, a.purchaseDate, a.cost, a.status, a.condition, a.location, a.assignedTo, a.image]
        );
      }
      for (const asg of INITIAL_ASSIGNMENTS) {
        await this.pg.query(
          'INSERT INTO assignments (id, assetId, employeeId, borrowDate, isActive) VALUES ($1, $2, $3, $4, $5)',
          [asg.id, asg.assetId, asg.employeeId, asg.borrowDate, asg.isActive]
        );
      }
      for (const m of INITIAL_MAINTENANCE) {
        await this.pg.query(
          'INSERT INTO maintenance_logs (id, assetId, description, vendor, cost, date, status) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [m.id, m.assetId, m.description, m.vendor, m.cost, m.date, m.status]
        );
      }
      for (const r of INITIAL_REQUESTS) {
        await this.pg.query(
          'INSERT INTO asset_requests (id, employeeId, category, reason, status, requestDate) VALUES ($1, $2, $3, $4, $5, $6)',
          [r.id, r.employeeId, r.category, r.reason, r.status, r.requestDate]
        );
      }
    }

    this.initialized = true;
  }

  private async ensureInit() {
    if (!this.initialized) await this.init();
    if (!this.pg) throw new Error('Postgres not initialized');
    return this.pg;
  }

  // --- ASSETS ---
  async getAssets(): Promise<Asset[]> {
    const db = await this.ensureInit();
    const res = await db.query('SELECT * FROM assets ORDER BY purchaseDate DESC');
    return res.rows as unknown as Asset[];
  }

  async saveAsset(asset: Asset): Promise<void> {
    const db = await this.ensureInit();
    await db.query(`
      INSERT INTO assets (id, tag, name, serialNumber, category, vendor, purchaseDate, cost, status, condition, location, assignedTo, image)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (id) DO UPDATE SET
        tag = EXCLUDED.tag,
        name = EXCLUDED.name,
        serialNumber = EXCLUDED.serialNumber,
        category = EXCLUDED.category,
        vendor = EXCLUDED.vendor,
        purchaseDate = EXCLUDED.purchaseDate,
        cost = EXCLUDED.cost,
        status = EXCLUDED.status,
        condition = EXCLUDED.condition,
        location = EXCLUDED.location,
        assignedTo = EXCLUDED.assignedTo,
        image = EXCLUDED.image
    `, [asset.id, asset.tag, asset.name, asset.serialNumber, asset.category, asset.vendor, asset.purchaseDate, asset.cost, asset.status, asset.condition, asset.location, asset.assignedTo || null, asset.image || null]);
  }

  async deleteAsset(id: string): Promise<void> {
    const db = await this.ensureInit();
    await db.query('DELETE FROM assets WHERE id = $1', [id]);
  }

  // --- EMPLOYEES ---
  async getEmployees(): Promise<Employee[]> {
    const db = await this.ensureInit();
    const res = await db.query('SELECT * FROM employees ORDER BY name ASC');
    return res.rows as unknown as Employee[];
  }

  async saveEmployee(employee: Employee): Promise<void> {
    const db = await this.ensureInit();
    await db.query(`
      INSERT INTO employees (id, name, email, department, role, joinDate, avatar)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        department = EXCLUDED.department,
        role = EXCLUDED.role,
        joinDate = EXCLUDED.joinDate,
        avatar = EXCLUDED.avatar
    `, [employee.id, employee.name, employee.email, employee.department, employee.role, employee.joinDate, employee.avatar || null]);
  }

  async deleteEmployee(id: string): Promise<void> {
    const db = await this.ensureInit();
    await db.query('DELETE FROM employees WHERE id = $1', [id]);
  }

  // --- ASSIGNMENTS ---
  async getAssignments(): Promise<Assignment[]> {
    const db = await this.ensureInit();
    const res = await db.query('SELECT * FROM assignments ORDER BY borrowDate DESC');
    return res.rows as unknown as Assignment[];
  }

  async saveAssignment(assignment: Assignment): Promise<void> {
    const db = await this.ensureInit();
    await db.query(`
      INSERT INTO assignments (id, assetId, employeeId, borrowDate, expectedReturnDate, returnedDate, notes, isActive)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET
        returnedDate = EXCLUDED.returnedDate,
        notes = EXCLUDED.notes,
        isActive = EXCLUDED.isActive
    `, [assignment.id, assignment.assetId, assignment.employeeId, assignment.borrowDate, assignment.expectedReturnDate || null, assignment.returnedDate || null, assignment.notes || null, assignment.isActive]);
  }

  // --- MAINTENANCE ---
  async getMaintenanceLogs(): Promise<MaintenanceLog[]> {
    const db = await this.ensureInit();
    const res = await db.query('SELECT * FROM maintenance_logs ORDER BY date DESC');
    return res.rows as unknown as MaintenanceLog[];
  }

  async saveMaintenanceLog(log: MaintenanceLog): Promise<void> {
    const db = await this.ensureInit();
    await db.query(`
      INSERT INTO maintenance_logs (id, assetId, description, vendor, cost, date, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status
    `, [log.id, log.assetId, log.description, log.vendor, log.cost, log.date, log.status]);
  }

  // --- REQUESTS ---
  async getRequests(): Promise<AssetRequest[]> {
    const db = await this.ensureInit();
    const res = await db.query('SELECT * FROM asset_requests ORDER BY requestDate DESC');
    return res.rows as unknown as AssetRequest[];
  }

  async saveRequest(req: AssetRequest): Promise<void> {
    const db = await this.ensureInit();
    await db.query(`
      INSERT INTO asset_requests (id, employeeId, category, reason, status, requestDate)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status
    `, [req.id, req.employeeId, req.category, req.reason, req.status, req.requestDate]);
  }
}

export const db = new DatabaseService();