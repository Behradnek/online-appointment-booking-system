const express = require('express');
const db = require('../database');
const authenticateToken = require('../middlewares/auth');
const requireAdmin = require('../middlewares/admin');

const router = express.Router();

router.use(authenticateToken);
router.use(requireAdmin);

router.get('/appointments', (req, res) => {
  try {
    const appointments = db.prepare(`
      SELECT
        appointments.id,
        appointments.appointment_date,
        appointments.appointment_time,
        appointments.status,
        appointments.created_at,
        users.id AS user_id,
        users.name AS user_name,
        users.email AS user_email,
        services.id AS service_id,
        services.name AS service_name,
        services.duration,
        services.price
      FROM appointments
      JOIN users ON appointments.user_id = users.id
      JOIN services ON appointments.service_id = services.id
      ORDER BY appointments.appointment_date ASC, appointments.appointment_time ASC
    `).all();

    return res.json(appointments);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.put('/appointments/:id/confirm', (req, res) => {
  try {
    const appointment = db.prepare('SELECT id FROM appointments WHERE id = ?').get(req.params.id);

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }

    db.prepare(`
      UPDATE appointments
      SET status = 'confirmed'
      WHERE id = ?
    `).run(req.params.id);

    return res.json({ message: 'Appointment confirmed successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.put('/appointments/:id/cancel', (req, res) => {
  try {
    const appointment = db.prepare('SELECT id FROM appointments WHERE id = ?').get(req.params.id);

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }

    db.prepare(`
      UPDATE appointments
      SET status = 'canceled'
      WHERE id = ?
    `).run(req.params.id);

    return res.json({ message: 'Appointment canceled successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
