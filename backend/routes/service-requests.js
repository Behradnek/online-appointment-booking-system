const express = require('express');
const db = require('../database');
const { verifyToken, checkRole } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken, checkRole('provider'));

router.post('/', async (req, res) => {
  try {
    const { categoryId, name, description = '', estimatedDuration, suggestedPrice } = req.body;

    if (!categoryId || !name || !estimatedDuration || !suggestedPrice) {
      return res.status(400).json({ error: 'Category, name, duration, and price are required.' });
    }

    const category = await db.get('SELECT id FROM categories WHERE id = ?', [categoryId]);
    if (!category) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    const result = await db.run(`
      INSERT INTO service_requests
        (provider_id, category_id, name, description, estimated_duration, suggested_price)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [req.user.id, categoryId, name, description, estimatedDuration, suggestedPrice]);

    return res.status(201).json({ message: 'Service request submitted.', id: result.id });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.get('/my', async (req, res) => {
  try {
    return res.json(await db.all(`
      SELECT service_requests.*, categories.name AS category_name
      FROM service_requests
      JOIN categories ON categories.id = service_requests.category_id
      WHERE provider_id = ?
      ORDER BY created_at DESC
    `, [req.user.id]));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
