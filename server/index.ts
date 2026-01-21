import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createPool } from 'mysql2/promise';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = createPool(process.env.DATABASE_URL || 'mysql://root:admin@localhost:3306/assetguard');

// Assets
// @ts-ignore - express types not included in build environment
app.get('/api/assets', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM assets ORDER BY purchaseDate DESC');
  res.json(rows);
});

// @ts-ignore - express types not included in build environment
app.post('/api/assets', async (req, res) => {
  const a = req.body;
  try {
    await pool.query(`
      INSERT INTO assets (id, tag, name, serialNumber, category, vendor, purchaseDate, cost, status, \`condition\`, location, assignedTo, image)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        tag = VALUES(tag), name = VALUES(name), serialNumber = VALUES(serialNumber), category = VALUES(category),
        vendor = VALUES(vendor), purchaseDate = VALUES(purchaseDate), cost = VALUES(cost), status = VALUES(status),
        \`condition\` = VALUES(\`condition\`), location = VALUES(location), assignedTo = VALUES(assignedTo), image = VALUES(image)
    `, [a.id, a.tag, a.name, a.serialNumber, a.category, a.vendor, a.purchaseDate, a.cost, a.status, a.condition, a.location, a.assignedTo || null, a.image || null]);
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

// @ts-ignore - express types not included in build environment
app.delete('/api/assets/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM assets WHERE id = ?', [req.params.id]);
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

// Employees
// @ts-ignore - express types not included in build environment
app.get('/api/employees', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM employees ORDER BY name ASC');
  res.json(rows);
});

// @ts-ignore - express types not included in build environment
app.post('/api/employees', async (req, res) => {
  const e = req.body;
  try {
    await pool.query(`
      INSERT INTO employees (id, name, email, department, role, joinDate, avatar)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE name = VALUES(name), email = VALUES(email), department = VALUES(department), role = VALUES(role), joinDate = VALUES(joinDate), avatar = VALUES(avatar)
    `, [e.id, e.name, e.email, e.department, e.role, e.joinDate, e.avatar || null]);
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

// @ts-ignore - express types not included in build environment
app.delete('/api/employees/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM employees WHERE id = ?', [req.params.id]);
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

// Assignments
// @ts-ignore - express types not included in build environment
app.get('/api/assignments', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM assignments ORDER BY borrowDate DESC');
  res.json(rows);
});

// @ts-ignore - express types not included in build environment
app.post('/api/assignments', async (req, res) => {
  const a = req.body;
  try {
    await pool.query(`
      INSERT INTO assignments (id, assetId, employeeId, borrowDate, expectedReturnDate, returnedDate, notes, isActive)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        returnedDate = VALUES(returnedDate), notes = VALUES(notes), isActive = VALUES(isActive)
    `, [a.id, a.assetId, a.employeeId, a.borrowDate, a.expectedReturnDate || null, a.returnedDate || null, a.notes || null, a.isActive]);
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

// Maintenance
// @ts-ignore - express types not included in build environment
app.get('/api/maintenance', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM maintenance_logs ORDER BY date DESC');
  res.json(rows);
});

// @ts-ignore - express types not included in build environment
app.post('/api/maintenance', async (req, res) => {
  const m = req.body;
  try {
    await pool.query(`
      INSERT INTO maintenance_logs (id, assetId, description, vendor, cost, date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE status = VALUES(status)
    `, [m.id, m.assetId, m.description, m.vendor, m.cost, m.date, m.status]);
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

// Requests
// @ts-ignore - express types not included in build environment
app.get('/api/requests', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM asset_requests ORDER BY requestDate DESC');
  res.json(rows);
});

// @ts-ignore - express types not included in build environment
app.post('/api/requests', async (req, res) => {
  const r = req.body;
  try {
    await pool.query(`
      INSERT INTO asset_requests (id, employeeId, category, reason, status, requestDate)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE status = VALUES(status), category = VALUES(category), reason = VALUES(reason)
    `, [r.id, r.employeeId, r.category, r.reason, r.status, r.requestDate]);
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
// @ts-ignore
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API server running on ${port}`));
