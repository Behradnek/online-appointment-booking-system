const express = require('express');
const db = require('../database');
const { verifyToken, checkRole } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken, checkRole('admin'));

router.get('/service-requests', async (req, res) => {
  try {
    const params = [];
    const statusFilter = req.query.status ? 'WHERE service_requests.status = ?' : '';
    if (req.query.status) {
      params.push(req.query.status);
    }

    return res.json(await db.all(`
      SELECT
        service_requests.*,
        categories.name AS category_name,
        users.name AS provider_name,
        users.family AS provider_family
      FROM service_requests
      JOIN categories ON categories.id = service_requests.category_id
      JOIN users ON users.id = service_requests.provider_id
      ${statusFilter}
      ORDER BY service_requests.created_at DESC
    `, params));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.put('/service-requests/:id/approve', async (req, res) => {
  try {
    const { finalPrice, finalDuration } = req.body;
    if (Number(finalPrice) <= 0 || Number(finalDuration) <= 0) {
      return res.status(400).json({ error: 'Final price and duration must be valid.' });
    }

    const request = await db.get(`
      SELECT * FROM service_requests WHERE id = ? AND status = 'pending'
    `, [req.params.id]);

    if (!request) {
      return res.status(404).json({ error: 'Pending service request not found.' });
    }

    const provider = await db.get(`
      SELECT max_services,
        (SELECT COUNT(*) FROM provider_services WHERE provider_id = users.id) AS service_count
      FROM users WHERE id = ?
    `, [request.provider_id]);

    if (provider.service_count >= provider.max_services) {
      return res.status(400).json({ error: 'Provider has reached the maximum number of services.' });
    }

    const service = await db.run(`
      INSERT INTO services (category_id, name, base_duration, base_price)
      VALUES (?, ?, ?, ?)
    `, [request.category_id, request.name, Number(finalDuration), Number(finalPrice)]);

    await db.run(`
      INSERT INTO provider_services (provider_id, service_id, price, duration, is_active)
      VALUES (?, ?, ?, ?, 1)
    `, [request.provider_id, service.id, Number(finalPrice), Number(finalDuration)]);

    await db.run(`
      UPDATE service_requests
      SET status = 'approved', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [req.user.id, request.id]);

    return res.json({ message: 'Service request approved.', serviceId: service.id });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.put('/service-requests/:id/reject', async (req, res) => {
  try {
    const { rejectReason } = req.body;
    if (!rejectReason) {
      return res.status(400).json({ error: 'Reject reason is required.' });
    }

    const result = await db.run(`
      UPDATE service_requests
      SET status = 'rejected', reject_reason = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
      WHERE id = ? AND status = 'pending'
    `, [rejectReason, req.user.id, req.params.id]);

    if (!result.changes) {
      return res.status(404).json({ error: 'Pending service request not found.' });
    }

    return res.json({ message: 'Service request rejected.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const filters = [];
    const params = [];

    if (req.query.role) {
      filters.push('role = ?');
      params.push(req.query.role);
    }

    if (req.query.isActive !== undefined && req.query.isActive !== '') {
      filters.push('is_active = ?');
      params.push(Number(req.query.isActive));
    }

    return res.json(await db.all(`
      SELECT id, name, family, email, phone, national_code, role, is_active, max_services, created_at
      FROM users
      ${filters.length ? `WHERE ${filters.join(' AND ')}` : ''}
      ORDER BY created_at DESC
    `, params));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.put('/users/:id/toggle-status', async (req, res) => {
  try {
    if (Number(req.params.id) === req.user.id) {
      return res.status(400).json({ error: 'Admin cannot deactivate their own account.' });
    }

    const user = await db.get('SELECT id, is_active FROM users WHERE id = ?', [req.params.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const nextStatus = user.is_active ? 0 : 1;
    await db.run('UPDATE users SET is_active = ? WHERE id = ?', [nextStatus, user.id]);
    return res.json({ message: 'User status updated.', is_active: nextStatus });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
