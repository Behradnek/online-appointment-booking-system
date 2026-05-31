const db = require('../database');

async function simulateSMS(phone, message, type = 'confirmation') {
  console.log(`[Simulated SMS] ${phone}: ${message}`);
  await db.run(
    'INSERT INTO sms_logs (phone, message, type) VALUES (?, ?, ?)',
    [phone, message, type]
  );
}

module.exports = { simulateSMS };
