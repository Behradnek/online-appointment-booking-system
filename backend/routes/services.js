const express = require('express');
const db = require('../database');

const router = express.Router();

router.get('/categories', async (req, res) => {
  try {
    return res.json(await db.all('SELECT id, name FROM categories ORDER BY id'));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.get('/services', async (req, res) => {
  try {
    const services = await db.all(`
      SELECT
        services.id,
        services.name,
        services.category_id,
        categories.name AS category_name,
        services.base_duration,
        services.base_price,
        COUNT(provider_services.id) AS provider_count
      FROM services
      JOIN categories ON categories.id = services.category_id
      LEFT JOIN provider_services
        ON provider_services.service_id = services.id
        AND provider_services.is_active = 1
      GROUP BY services.id
      ORDER BY categories.name, services.name
    `);

    return res.json(services);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.get('/providers/:serviceId', async (req, res) => {
  try {
    const providers = await db.all(`
      SELECT
        users.id,
        users.name,
        users.family,
        provider_services.price,
        COALESCE(provider_services.duration, services.base_duration) AS duration,
        COALESCE(cancellation_policies.min_hours_before, 24) AS min_hours_before,
        COALESCE(cancellation_policies.enable_penalty, 0) AS enable_penalty,
        cancellation_policies.description AS cancellation_description
      FROM provider_services
      JOIN users ON users.id = provider_services.provider_id
      JOIN services ON services.id = provider_services.service_id
      LEFT JOIN cancellation_policies ON cancellation_policies.provider_id = users.id
      WHERE provider_services.service_id = ?
        AND provider_services.is_active = 1
        AND users.is_active = 1
      ORDER BY users.family, users.name
    `, [req.params.serviceId]);

    return res.json(providers);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
