const bcrypt = require('bcryptjs');

async function insertUser(db, user) {
  const existing = await db.get('SELECT id FROM users WHERE email = ?', [user.email]);

  if (existing) {
    return existing.id;
  }

  const password = await bcrypt.hash(user.password, 10);
  const result = await db.run(`
    INSERT INTO users (name, family, email, phone, national_code, password, role)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [user.name, user.family, user.email, user.phone, user.nationalCode, password, user.role]);

  return result.id;
}

async function seedDatabase(db) {
  const categoryNames = ['پزشکی', 'زیبایی', 'مشاوره', 'دندانپزشکی'];

  for (const name of categoryNames) {
    await db.run('INSERT OR IGNORE INTO categories (name) VALUES (?)', [name]);
  }

  await insertUser(db, {
    name: 'مدیر',
    family: 'سیستم',
    email: 'admin@example.com',
    phone: '09120000001',
    nationalCode: '0010000001',
    password: '123456',
    role: 'admin'
  });

  const providerId = await insertUser(db, {
    name: 'سارا',
    family: 'احمدی',
    email: 'provider@example.com',
    phone: '09120000002',
    nationalCode: '0010000002',
    password: '123456',
    role: 'provider'
  });

  await insertUser(db, {
    name: 'علی',
    family: 'رضایی',
    email: 'user@example.com',
    phone: '09120000003',
    nationalCode: '0010000003',
    password: '123456',
    role: 'user'
  });

  const medical = await db.get('SELECT id FROM categories WHERE name = ?', ['پزشکی']);
  const consulting = await db.get('SELECT id FROM categories WHERE name = ?', ['مشاوره']);
  const dentistry = await db.get('SELECT id FROM categories WHERE name = ?', ['دندانپزشکی']);

  const sampleServices = [
    [medical.id, 'ویزیت عمومی', 30, 500000],
    [consulting.id, 'مشاوره تغذیه', 45, 800000],
    [dentistry.id, 'معاینه دندانپزشکی', 60, 1200000]
  ];

  for (const [categoryId, name, duration, price] of sampleServices) {
    await db.run(`
      INSERT INTO services (category_id, name, base_duration, base_price)
      SELECT ?, ?, ?, ?
      WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = ?)
    `, [categoryId, name, duration, price, name]);
  }

  const services = await db.all(`
    SELECT id, base_price, base_duration
    FROM services
    WHERE name IN ('ویزیت عمومی', 'مشاوره تغذیه', 'معاینه دندانپزشکی')
  `);

  for (const service of services) {
    await db.run(`
      INSERT OR IGNORE INTO provider_services (provider_id, service_id, price, duration, is_active)
      VALUES (?, ?, ?, ?, 1)
    `, [providerId, service.id, service.base_price, service.base_duration]);
  }

  for (let day = 0; day <= 5; day += 1) {
    await db.run(`
      INSERT OR IGNORE INTO working_hours (provider_id, day_of_week, start_time, end_time, slot_duration)
      VALUES (?, ?, '09:00', '17:00', 30)
    `, [providerId, day]);
  }

  await db.run(`
    INSERT OR IGNORE INTO cancellation_policies (provider_id, min_hours_before, enable_penalty, description)
    VALUES (?, 24, 0, ?)
  `, [providerId, 'لغو نوبت تا ۲۴ ساعت قبل بدون جریمه امکان‌پذیر است.']);
}

module.exports = { seedDatabase };
