const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, 'database.sqlite');
const connection = new sqlite3.Database(dbPath);

function exec(sql) {
  return new Promise((resolve, reject) => {
    connection.exec(sql, (error) => (error ? reject(error) : resolve()));
  });
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    connection.run(sql, params, function callback(error) {
      if (error) {
        reject(error);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    connection.get(sql, params, (error, row) => (error ? reject(error) : resolve(row)));
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    connection.all(sql, params, (error, rows) => (error ? reject(error) : resolve(rows)));
  });
}

async function migrateLegacyDemo() {
  const table = await get("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'users'");

  if (!table) {
    return;
  }

  const columns = await all('PRAGMA table_info(users)');
  const hasExpandedSchema = columns.some((column) => column.name === 'family');

  if (!hasExpandedSchema) {
    await exec(`
      PRAGMA foreign_keys = OFF;
      DROP TABLE IF EXISTS appointments;
      DROP TABLE IF EXISTS services;
      DROP TABLE IF EXISTS users;
      PRAGMA foreign_keys = ON;
    `);
  }
}

async function createTables() {
  await exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      family TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      national_code TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'provider', 'user')),
      is_active INTEGER NOT NULL DEFAULT 1,
      max_services INTEGER NOT NULL DEFAULT 10,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      base_duration INTEGER NOT NULL,
      base_price INTEGER NOT NULL,
      FOREIGN KEY(category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS provider_services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider_id INTEGER NOT NULL,
      service_id INTEGER NOT NULL,
      price INTEGER NOT NULL,
      duration INTEGER,
      is_active INTEGER NOT NULL DEFAULT 1,
      UNIQUE(provider_id, service_id),
      FOREIGN KEY(provider_id) REFERENCES users(id),
      FOREIGN KEY(service_id) REFERENCES services(id)
    );

    CREATE TABLE IF NOT EXISTS service_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      estimated_duration INTEGER NOT NULL,
      suggested_price INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
      reject_reason TEXT,
      reviewed_by INTEGER,
      reviewed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(provider_id) REFERENCES users(id),
      FOREIGN KEY(category_id) REFERENCES categories(id),
      FOREIGN KEY(reviewed_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS working_hours (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider_id INTEGER NOT NULL,
      day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 0 AND 6),
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      slot_duration INTEGER NOT NULL,
      UNIQUE(provider_id, day_of_week),
      FOREIGN KEY(provider_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS cancellation_policies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider_id INTEGER UNIQUE NOT NULL,
      min_hours_before INTEGER NOT NULL DEFAULT 24,
      enable_penalty INTEGER NOT NULL DEFAULT 0,
      description TEXT,
      FOREIGN KEY(provider_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      provider_id INTEGER NOT NULL,
      service_id INTEGER NOT NULL,
      guest_name TEXT NOT NULL,
      guest_family TEXT NOT NULL,
      guest_phone TEXT NOT NULL,
      guest_national_code TEXT NOT NULL,
      appointment_date TEXT NOT NULL,
      appointment_time TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'completed', 'canceled')),
      payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK(payment_status IN ('unpaid', 'paid', 'refunded')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(provider_id) REFERENCES users(id),
      FOREIGN KEY(service_id) REFERENCES services(id)
    );

    CREATE TABLE IF NOT EXISTS sms_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('reminder', 'confirmation', 'cancellation')),
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_active_provider_slot
    ON appointments(provider_id, appointment_date, appointment_time)
    WHERE status IN ('pending', 'confirmed');
  `);
}

async function initializeDatabase() {
  await migrateLegacyDemo();
  await createTables();
  const { seedDatabase } = require('./seed');
  await seedDatabase({ get, run, all });
}

const ready = initializeDatabase();

module.exports = {
  connection,
  exec,
  run,
  get,
  all,
  ready
};
