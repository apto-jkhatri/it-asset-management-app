import dotenv from 'dotenv';
import { createConnection, createPool } from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config();

async function setup() {
  console.log('🚀 Starting database setup...\n');

  try {
    // Step 1: Connect to MySQL (without selecting a database first)
    console.log('📝 Step 1: Connecting to MySQL server...');
    const connection = await createConnection({
      host: 'localhost',
      user: 'root',
      password: 'admin',
      port: 3306,
    });
    console.log('✅ Connected to MySQL server\n');

    // Step 2: Create database
    console.log('📝 Step 2: Creating database "assetguard"...');
    await connection.query('CREATE DATABASE IF NOT EXISTS assetguard');
    console.log('✅ Database created or already exists\n');

    // Close first connection
    await connection.end();

    // Step 3: Create pool for the database
    console.log('📝 Step 3: Connecting to assetguard database...');
    const pool = createPool({
      host: 'localhost',
      user: 'root',
      password: 'admin',
      database: 'assetguard',
      port: 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
    console.log('✅ Connected to assetguard database\n');

    // Step 4: Read and execute migrations
    console.log('📝 Step 4: Creating tables...');
    const migrationsPath = path.join(__dirname, 'migrations.sql');
    let migrationsSql = fs.readFileSync(migrationsPath, 'utf-8');
    
    // Remove the USE and CREATE DATABASE statements since we're already connected
    migrationsSql = migrationsSql
      .replace(/CREATE DATABASE IF NOT EXISTS.*?;/g, '')
      .replace(/USE assetguard;/g, '');
    
    // Split by semicolon and execute each statement
    const statements = migrationsSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    for (const statement of statements) {
      await pool.query(statement);
    }
    console.log('✅ All tables created\n');

    // Step 5: Seed data (skip when CLEAN=true)
    if (process.env.CLEAN) {
      console.log('📝 Skipping seeding because CLEAN is set');
    } else {
      console.log('📝 Step 5: Seeding initial data...');
      const seedDataPath = path.join(__dirname, 'seedData.json');
      const seedDataRaw = fs.readFileSync(seedDataPath, 'utf-8');
      const seedData = JSON.parse(seedDataRaw);

      const conn = await pool.getConnection();
      try {
        // Check if already seeded
        const [rows] = await conn.query('SELECT COUNT(*) as cnt FROM employees');
        const count = (rows as any)[0].cnt;

        if (count === 0) {
          console.log('   - Inserting employees...');
          for (const e of seedData.INITIAL_EMPLOYEES) {
            await conn.query(
              'INSERT INTO employees (id, name, email, department, role, joinDate, avatar) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [e.id, e.name, e.email, e.department, e.role, e.joinDate, e.avatar || null]
            );
          }

          console.log('   - Inserting assets...');
          for (const a of seedData.INITIAL_ASSETS) {
            await conn.query(
              'INSERT INTO assets (id, tag, name, serialNumber, category, vendor, purchaseDate, cost, status, `condition`, location, assignedTo, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [a.id, a.tag, a.name, a.serialNumber, a.category, a.vendor, a.purchaseDate, a.cost, a.status, a.condition, a.location, a.assignedTo || null, a.image || null]
            );
          }

          console.log('   - Inserting assignments...');
          for (const asg of seedData.INITIAL_ASSIGNMENTS) {
            await conn.query(
              'INSERT INTO assignments (id, assetId, employeeId, borrowDate, isActive) VALUES (?, ?, ?, ?, ?)',
              [asg.id, asg.assetId, asg.employeeId, asg.borrowDate, asg.isActive]
            );
          }

          console.log('   - Inserting maintenance logs...');
          for (const m of seedData.INITIAL_MAINTENANCE) {
            await conn.query(
              'INSERT INTO maintenance_logs (id, assetId, description, vendor, cost, date, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [m.id, m.assetId, m.description, m.vendor, m.cost, m.date, m.status]
            );
          }

          console.log('   - Inserting asset requests...');
          for (const r of seedData.INITIAL_REQUESTS) {
            await conn.query(
              'INSERT INTO asset_requests (id, employeeId, category, reason, status, requestDate) VALUES (?, ?, ?, ?, ?, ?)',
              [r.id, r.employeeId, r.category, r.reason, r.status, r.requestDate]
            );
          }

          console.log('✅ All seed data inserted\n');
        } else {
          console.log('✅ Database already seeded (skipping)\n');
        }
      } finally {
        await conn.release();
      }

      }

      // Step 6: Verify
    console.log('📝 Step 6: Verifying setup...');
    const [tables] = await pool.query('SHOW TABLES');
    console.log(`✅ Database has ${(tables as any).length} tables\n`);

    // Close pool
    await pool.end();

    console.log('🎉 Setup complete! You can now run:\n');
    console.log('   npm run dev:server    (start the API server)');
    console.log('   npm run dev           (start the frontend)\n');
    console.log('Then open http://localhost:5173 in your browser.\n');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

setup();
