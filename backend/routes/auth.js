const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');

const router = express.Router();

function createToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { algorithm: 'HS256', expiresIn: '7d' }
  );
}

router.post('/register', async (req, res) => {
  try {
    const { name, family, email, phone, national_code: nationalCode, password, role = 'user' } = req.body;

    if (!name || !family || !email || !phone || !nationalCode || !password) {
      return res.status(400).json({ error: 'All registration fields are required.' });
    }

    if (!['user', 'provider'].includes(role)) {
      return res.status(400).json({ error: 'Role must be user or provider.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await db.get(`
      SELECT id FROM users WHERE email = ? OR phone = ? OR national_code = ?
    `, [normalizedEmail, phone, nationalCode]);

    if (existing) {
      return res.status(409).json({ error: 'Email, phone, or national code is already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.run(`
      INSERT INTO users (name, family, email, phone, national_code, password, role)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [name, family, normalizedEmail, phone, nationalCode, hashedPassword, role]);

    if (role === 'provider') {
      await db.run(`
        INSERT INTO cancellation_policies (provider_id, min_hours_before, enable_penalty, description)
        VALUES (?, 24, 0, ?)
      `, [result.id, 'لغو نوبت تا ۲۴ ساعت قبل بدون جریمه امکان‌پذیر است.']);
    }

    const user = { id: result.id, name, family, email: normalizedEmail, phone, national_code: nationalCode, role };
    return res.status(201).json({ message: 'Registration successful.', token: createToken(user), user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await db.get('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()]);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'This account has been deactivated.' });
    }

    const publicUser = {
      id: user.id,
      name: user.name,
      family: user.family,
      email: user.email,
      phone: user.phone,
      national_code: user.national_code,
      role: user.role
    };

    return res.json({ message: 'Login successful.', token: createToken(user), user: publicUser });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
