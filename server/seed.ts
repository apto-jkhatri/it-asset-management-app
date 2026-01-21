import dotenv from 'dotenv';
import { createPool } from 'mysql2/promise';
import fs from 'fs';
const raw = fs.readFileSync(new URL('./seedData.json', import.meta.url));
const parsed = JSON.parse(raw.toString());
const INITIAL_ASSETS = parsed.INITIAL_ASSETS;
const INITIAL_EMPLOYEES = parsed.INITIAL_EMPLOYEES;
const INITIAL_ASSIGNMENTS = parsed.INITIAL_ASSIGNMENTS;
const INITIAL_MAINTENANCE = parsed.INITIAL_MAINTENANCE;
const INITIAL_REQUESTS = parsed.INITIAL_REQUESTS;

dotenv.config();

const pool = createPool(process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/assetguard');

async function seed() {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query('SELECT COUNT(*) as cnt FROM employees');
    const count = (rows as any)[0].cnt;
    if (count === 0) {
      console.log('Seeding database...');
      for (const e of INITIAL_EMPLOYEES) {
        await conn.query('INSERT INTO employees (id, name, email, department, role, joinDate, avatar) VALUES (?, ?, ?, ?, ?, ?, ?)', [e.id, e.name, e.email, e.department, e.role, e.joinDate, e.avatar || null]);
      }
      for (const a of INITIAL_ASSETS) {
        await conn.query('INSERT INTO assets (id, tag, name, serialNumber, category, vendor, purchaseDate, cost, status, condition, location, assignedTo, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [a.id, a.tag, a.name, a.serialNumber, a.category, a.vendor, a.purchaseDate, a.cost, a.status, a.condition, a.location, a.assignedTo || null, a.image || null]);
      }
      for (const asg of INITIAL_ASSIGNMENTS) {
        await conn.query('INSERT INTO assignments (id, assetId, employeeId, borrowDate, isActive) VALUES (?, ?, ?, ?, ?)', [asg.id, asg.assetId, asg.employeeId, asg.borrowDate, asg.isActive]);
      }
      for (const m of INITIAL_MAINTENANCE) {
        await conn.query('INSERT INTO maintenance_logs (id, assetId, description, vendor, cost, date, status) VALUES (?, ?, ?, ?, ?, ?, ?)', [m.id, m.assetId, m.description, m.vendor, m.cost, m.date, m.status]);
      }
      for (const r of INITIAL_REQUESTS) {
        await conn.query('INSERT INTO asset_requests (id, employeeId, category, reason, status, requestDate) VALUES (?, ?, ?, ?, ?, ?)', [r.id, r.employeeId, r.category, r.reason, r.status, r.requestDate]);
      }
      console.log('Seeding complete.');
    } else {
      console.log('Database already seeded.');
    }
  } finally {
    conn.release();
    await pool.end();
  }
}

seed().catch(e => { console.error(e); process.exit(1); });
