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

// Request logger for debugging
app.use((req: any, res: any, next: any) => {
  res.on('finish', () => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - ${res.statusCode}`);
  });
  next();
});

// Health check to verify DB connection
app.get('/api/health', async (req: any, res: any) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'OK', database: 'Connected' });
  } catch (err) {
    res.status(500).json({ status: 'ERROR', database: 'Disconnected', details: String(err) });
  }
});

const pool = createPool(process.env.DATABASE_URL || 'mysql://root:admin@localhost:3306/assetguard');

// Import authentication middleware
import { authMiddleware, requireAuth, requireAdmin, generateSessionToken, createSession, deleteSession, AuthUser } from './middleware/auth.js';

// Apply auth middleware to all routes
app.use(authMiddleware);

// Authentication Endpoints
app.post('/api/auth/login', async (req: any, res: any) => {
  const { email, password } = req.body;

  try {
    const [rows]: any = await pool.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = rows[0];
    const token = generateSessionToken();
    const authUser: AuthUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId
    };

    createSession(token, authUser);

    res.json({ user: authUser, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/logout', requireAuth, (req: any, res: any) => {
  const token = req.headers['authorization']?.replace('Bearer ', '') || req.headers['x-session-token'];
  if (token) {
    deleteSession(token);
  }
  res.json({ success: true });
});

app.get('/api/auth/me', requireAuth, (req: any, res: any) => {
  res.json(req.user);
});

// User Management Endpoints (Admin only)
app.get('/api/users', requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const [rows] = await pool.query('SELECT id, name, email, role, createdAt FROM users ORDER BY name ASC');
    res.json(rows);
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post('/api/users', requireAuth, requireAdmin, async (req: any, res: any) => {
  const { name, email, password, role, department, shouldCreateEmployee = false } = req.body;
  const userId = `USR-${Date.now()}`;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Check if an employee with this email already exists
    const [existingEmployees]: any = await connection.query('SELECT id FROM employees WHERE email = ?', [email]);
    let employeeId = existingEmployees.length > 0 ? existingEmployees[0].id : null;

    // 2. Create Employee record if not found and requested
    if (!employeeId && shouldCreateEmployee) {
      employeeId = `EMP-${Date.now()}`;
      await connection.query(
        'INSERT INTO employees (id, name, email, department, role, joinDate) VALUES (?, ?, ?, ?, ?, ?)',
        [employeeId, name, email, department || 'Staff', role === 'admin' ? 'Administrator' : 'Employee', new Date().toISOString().split('T')[0]]
      );
    }

    // 3. Create User record
    await connection.query(
      'INSERT INTO users (id, name, email, password, role, employeeId) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, name, email, password, role || 'user', employeeId]
    );

    await connection.commit();
    res.json({ id: userId, name, email, role: role || 'user', employeeId });
  } catch (err: any) {
    await connection.rollback();
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'Email already exists' });
    } else {
      console.error('Create user error:', err);
      res.status(500).json({ error: 'Failed to create user' });
    }
  } finally {
    connection.release();
  }
});

app.delete('/api/users/:id', requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

app.put('/api/users/:id/password', requireAuth, async (req: any, res: any) => {
  const { password } = req.body;
  const targetUserId = req.params.id;

  // Permission: Admin can reset anyone, users can only reset themselves
  if (req.user.role !== 'admin' && req.user.id !== targetUserId) {
    return res.status(403).json({ error: 'Unauthorized to change this password' });
  }

  try {
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [password, targetUserId]);
    res.json({ success: true });
  } catch (err) {
    console.error('Password reset error:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});


// Assets
// @ts-ignore - express types not included in build environment
app.get('/api/assets', requireAuth, async (req: any, res: any) => {
  try {
    const [rows] = await pool.query('SELECT * FROM assets ORDER BY purchaseDate DESC');
    res.json(rows);
  } catch (err) {
    console.error('API Error /api/assets:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// @ts-ignore - express types not included in build environment
app.post('/api/assets', requireAuth, requireAdmin, async (req: any, res: any) => {
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
app.delete('/api/assets/:id', requireAuth, requireAdmin, async (req: any, res: any) => {
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
app.get('/api/employees', requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const [rows] = await pool.query('SELECT * FROM employees ORDER BY name ASC');
    res.json(rows);
  } catch (err) {
    console.error('API Error /api/employees:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// @ts-ignore - express types not included in build environment
app.post('/api/employees', requireAuth, requireAdmin, async (req: any, res: any) => {
  const e = req.body;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Update/Insert Employee
    await connection.query(`
      INSERT INTO employees (id, name, email, department, role, joinDate, avatar)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE name = VALUES(name), email = VALUES(email), department = VALUES(department), role = VALUES(role), joinDate = VALUES(joinDate), avatar = VALUES(avatar)
    `, [e.id, e.name, e.email, e.department, e.role, e.joinDate, e.avatar || null]);

    // 2. Synchronize email with linked User if any
    await connection.query(`
      UPDATE users SET email = ? WHERE employeeId = ?
    `, [e.email, e.id]);

    await connection.commit();
    res.sendStatus(200);
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ error: 'db error' });
  } finally {
    connection.release();
  }
});

// @ts-ignore - express types not included in build environment
app.delete('/api/employees/:id', requireAuth, requireAdmin, async (req: any, res: any) => {
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
app.get('/api/assignments', requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const [rows] = await pool.query('SELECT * FROM assignments ORDER BY borrowDate DESC');
    res.json(rows);
  } catch (err) {
    console.error('API Error /api/assignments:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// @ts-ignore - express types not included in build environment
app.post('/api/assignments', requireAuth, requireAdmin, async (req: any, res: any) => {
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
app.get('/api/maintenance', requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const [rows] = await pool.query('SELECT * FROM maintenance_logs ORDER BY date DESC');
    res.json(rows);
  } catch (err) {
    console.error('API Error /api/maintenance:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// @ts-ignore - express types not included in build environment
app.post('/api/maintenance', requireAuth, requireAdmin, async (req: any, res: any) => {
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
app.get('/api/requests', requireAuth, async (req: any, res: any) => {
  try {
    let query = `
      SELECT r.*, m.userId, m.userName, m.userEmail, m.requestIp,
             (SELECT COUNT(*) FROM ticket_messages WHERE requestId = r.id) as messageCount
      FROM asset_requests r
      LEFT JOIN request_metadata m ON r.id = m.requestId
    `;
    let params: any[] = [];

    // Standard users only see their own requests
    if (req.user.role === 'user') {
      query += ' WHERE r.employeeId = ? OR m.userId = ?';
      params = [req.user.employeeId, req.user.id];
    }

    query += ' ORDER BY r.requestDate DESC';

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('API Error /api/requests:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// Ticket Messages (Chat)
app.get('/api/requests/:id/messages', requireAuth, async (req: any, res: any) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM ticket_messages WHERE requestId = ? ORDER BY timestamp ASC',
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('API Error /api/requests/:id/messages:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.post('/api/requests/:id/messages', requireAuth, async (req: any, res: any) => {
  const { message } = req.body;
  const messageId = `MSG-${Date.now()}`;

  try {
    await pool.query(
      'INSERT INTO ticket_messages (id, requestId, senderId, senderName, message) VALUES (?, ?, ?, ?, ?)',
      [messageId, req.params.id, req.user.id, req.user.name, message]
    );
    res.json({ id: messageId, requestId: req.params.id, senderId: req.user.id, senderName: req.user.name, message, timestamp: new Date() });
  } catch (err) {
    console.error('API Error POST /api/requests/:id/messages:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// @ts-ignore - express types not included in build environment
app.post('/api/requests', requireAuth, async (req: any, res: any) => {
  const r = req.body;
  // Security/Reliability: Always prefer the employeeId from the authenticated session
  const employeeId = req.user.role === 'admin' ? (r.employeeId || req.user.employeeId) : req.user.employeeId;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query(`
        INSERT INTO asset_requests (id, employeeId, category, reason, status, requestDate)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE status = VALUES(status), category = VALUES(category), reason = VALUES(reason)
      `, [r.id, employeeId, r.category, r.reason, r.status, r.requestDate]);

    // Insert or update metadata
    const metadataId = `META-${r.id}`;
    await connection.query(`
      INSERT INTO request_metadata (id, requestId, userId, userName, userEmail, requestIp)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        userName = VALUES(userName), 
        userEmail = VALUES(userEmail), 
        requestIp = VALUES(requestIp)
    `, [metadataId, r.id, req.user.id, req.user.name, req.user.email, req.userIp]);

    await connection.commit();
    res.sendStatus(200);
  } catch (err) {
    await connection.rollback();
    console.error('API Error POST /api/requests:', err);
    res.status(500).json({ error: 'Database operation failed' });
  } finally {
    connection.release();
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
