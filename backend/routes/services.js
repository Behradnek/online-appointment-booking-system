const express = require('express');
const db = require('../database');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const services = db.prepare(`
      SELECT id, name, duration, price
      FROM services
      ORDER BY id ASC
    `).all();

    return res.json(services);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
