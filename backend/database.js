const path = require('path');
const bcrypt = require('bcrypt');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

db.pragma('foreign_keys = ON');

function createTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user'
    );

    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      duration INTEGER NOT NULL,
      price INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      service_id INTEGER NOT NULL,
      appointment_date TEXT NOT NULL,
      appointment_time TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(service_id) REFERENCES services(id)
    );
  `);
}

function seedServices() {
  const count = db.prepare('SELECT COUNT(*) AS count FROM services').get().count;

  if (count === 0) {
    const insertService = db.prepare(`
      INSERT INTO services (name, duration, price)
      VALUES (?, ?, ?)
    `);

    const insertMany = db.transaction((services) => {
      services.forEach((service) => insertService.run(service.name, service.duration, service.price));
    });

    insertMany([
      { name: 'General Consultation', duration: 30, price: 50000 },
      { name: 'Nutrition Consultation', duration: 45, price: 80000 },
      { name: 'Dentistry', duration: 60, price: 120000 }
    ]);
  }
}

function seedAdminUser() {
  const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@example.com');

  if (!existingAdmin) {
    const hashedPassword = bcrypt.hashSync('123456', 10);

    db.prepare(`
      INSERT INTO users (name, email, password, role)
      VALUES (?, ?, ?, ?)
    `).run('Admin User', 'admin@example.com', hashedPassword, 'admin');
  }
}

function initializeDatabase() {
  createTables();
  seedServices();
  seedAdminUser();
}

initializeDatabase();

module.exports = db;
