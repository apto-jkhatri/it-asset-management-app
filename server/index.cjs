const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const dbUrl = process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/assetguard';
const parseDbUrl = (url) => {
  // mysql://user:pass@host:port/db
  try {
    const u = new URL(url);
    return {
      host: u.hostname,
      user: u.username,
      password: u.password,
      database: u.pathname.replace(/\//, ''),
      port: u.port ? parseInt(u.port, 10) : 3306,
    };
  } catch (e) {
    return { host: 'localhost', user: 'root', password: 'password', database: 'assetguard', port: 3306 };
  }
};

const dbConfig = parseDbUrl(dbUrl);
const pool = mysql.createPool(dbConfig);

// Assets
app.get('/api/assets', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM assets ORDER BY purchaseDate DESC');
  res.json(rows);
});

app.post('/api/assets', async (req, res) => {
  const a = req.body;
  try {
    const insertAssetsSql = 'INSERT INTO assets (id, tag, name, serialNumber, category, vendor, purchaseDate, cost, status, `condition`, location, assignedTo, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE tag = VALUES(tag), name = VALUES(name), serialNumber = VALUES(serialNumber), category = VALUES(category), vendor = VALUES(vendor), purchaseDate = VALUES(purchaseDate), cost = VALUES(cost), status = VALUES(status), `condition` = VALUES(`condition`), location = VALUES(location), assignedTo = VALUES(assignedTo), image = VALUES(image)';
    await pool.query(insertAssetsSql, [a.id, a.tag, a.name, a.serialNumber, a.category, a.vendor, a.purchaseDate, a.cost, a.status, a.condition, a.location, a.assignedTo || null, a.image || null]);
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

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
app.get('/api/employees', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM employees ORDER BY name ASC');
  res.json(rows);
});

app.post('/api/employees', async (req, res) => {
  const e = req.body;
  try {
    await pool.query(`\n      INSERT INTO employees (id, name, email, department, role, joinDate, avatar)\n      VALUES (?, ?, ?, ?, ?, ?, ?)\n      ON DUPLICATE KEY UPDATE name = VALUES(name), email = VALUES(email), department = VALUES(department), role = VALUES(role), joinDate = VALUES(joinDate), avatar = VALUES(avatar)\n    `, [e.id, e.name, e.email, e.department, e.role, e.joinDate, e.avatar || null]);
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

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
app.get('/api/assignments', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM assignments ORDER BY borrowDate DESC');
  res.json(rows);
});

app.post('/api/assignments', async (req, res) => {
  const a = req.body;
  try {
    await pool.query('INSERT INTO assignments (id, assetId, employeeId, borrowDate, expectedReturnDate, returnedDate, notes, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE assetId=VALUES(assetId), employeeId=VALUES(employeeId), borrowDate=VALUES(borrowDate), expectedReturnDate=VALUES(expectedReturnDate), returnedDate=VALUES(returnedDate), notes=VALUES(notes), isActive=VALUES(isActive)', [a.id, a.assetId, a.employeeId, a.borrowDate, a.expectedReturnDate || null, a.returnedDate || null, a.notes || null, a.isActive]);
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

app.delete('/api/assignments/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM assignments WHERE id = ?', [req.params.id]);
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

// Maintenance logs
app.get('/api/maintenance', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM maintenance_logs ORDER BY date DESC');
  res.json(rows);
});

app.post('/api/maintenance', async (req, res) => {
  const m = req.body;
  try {
    await pool.query('INSERT INTO maintenance_logs (id, assetId, description, vendor, cost, date, status) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE assetId=VALUES(assetId), description=VALUES(description), vendor=VALUES(vendor), cost=VALUES(cost), date=VALUES(date), status=VALUES(status)', [m.id, m.assetId, m.description, m.vendor, m.cost, m.date, m.status]);
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

// Asset requests
app.get('/api/requests', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM asset_requests ORDER BY requestDate DESC');
  res.json(rows);
});

app.post('/api/requests', async (req, res) => {
  const r = req.body;
  try {
    await pool.query('INSERT INTO asset_requests (id, employeeId, category, reason, status, requestDate) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE employeeId=VALUES(employeeId), category=VALUES(category), reason=VALUES(reason), status=VALUES(status), requestDate=VALUES(requestDate)', [r.id, r.employeeId, r.category, r.reason, r.status, r.requestDate]);
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});


const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API server running on ${port}`));
