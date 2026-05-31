const express = require('express');
const db = require('../database');
const { verifyToken, checkRole } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken, checkRole('provider'));

router.get('/appointments', async (req, res) => {
  try {
    const filters = ['appointments.provider_id = ?'];
    const params = [req.user.id];

    if (req.query.date) {
      filters.push('appointments.appointment_date = ?');
      params.push(req.query.date);
    }

    if (req.query.status) {
      filters.push('appointments.status = ?');
      params.push(req.query.status);
    }

    return res.json(await db.all(`
      SELECT appointments.*, services.name AS service_name,
        users.name AS user_name, users.family AS user_family
      FROM appointments
      JOIN services ON services.id = appointments.service_id
      JOIN users ON users.id = appointments.user_id
      WHERE ${filters.join(' AND ')}
      ORDER BY appointments.appointment_date DESC, appointments.appointment_time DESC
    `, params));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.put('/appointments/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['confirmed', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Status must be confirmed or completed.' });
    }

    const appointment = await db.get(`
      SELECT id, status FROM appointments WHERE id = ? AND provider_id = ?
    `, [req.params.id, req.user.id]);

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }

    const validTransition = (
      (status === 'confirmed' && appointment.status === 'pending')
      || (status === 'completed' && appointment.status === 'confirmed')
    );

    if (!validTransition) {
      return res.status(400).json({ error: 'Appointment status transition is not allowed.' });
    }

    await db.run('UPDATE appointments SET status = ? WHERE id = ?', [status, appointment.id]);
    return res.json({ message: `Appointment marked as ${status}.` });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.get('/cancellation-policy', async (req, res) => {
  try {
    const policy = await db.get(`
      SELECT min_hours_before, enable_penalty, description
      FROM cancellation_policies
      WHERE provider_id = ?
    `, [req.user.id]);

    return res.json(policy || { min_hours_before: 24, enable_penalty: 0, description: '' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.put('/cancellation-policy', async (req, res) => {
  try {
    const { minHoursBefore, enablePenalty = false, description = '' } = req.body;

    if (Number(minHoursBefore) < 0) {
      return res.status(400).json({ error: 'Minimum cancellation hours must be zero or greater.' });
    }

    await db.run(`
      INSERT INTO cancellation_policies (provider_id, min_hours_before, enable_penalty, description)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(provider_id) DO UPDATE SET
        min_hours_before = excluded.min_hours_before,
        enable_penalty = excluded.enable_penalty,
        description = excluded.description
    `, [req.user.id, Number(minHoursBefore), enablePenalty ? 1 : 0, description]);

    return res.json({ message: 'Cancellation policy saved.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
