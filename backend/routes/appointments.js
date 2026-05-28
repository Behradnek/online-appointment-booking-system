const express = require('express');
const db = require('../database');
const authenticateToken = require('../middlewares/auth');

const router = express.Router();

function isValidDateFormat(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

function isValidTimeFormat(time) {
  return /^\d{2}:\d{2}$/.test(time);
}

function isTodayOrFuture(date) {
  const selectedDate = new Date(`${date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return !Number.isNaN(selectedDate.getTime()) && selectedDate >= today;
}

function isWorkingHour(time) {
  if (!isValidTimeFormat(time)) {
    return false;
  }

  const [hours, minutes] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes;
  const startMinutes = 9 * 60;
  const endMinutes = 17 * 60;

  return totalMinutes >= startMinutes && totalMinutes <= endMinutes;
}

router.use(authenticateToken);

router.get('/', (req, res) => {
  try {
    const appointments = db.prepare(`
      SELECT
        appointments.id,
        appointments.appointment_date,
        appointments.appointment_time,
        appointments.status,
        services.name AS service_name,
        services.duration,
        services.price
      FROM appointments
      JOIN services ON appointments.service_id = services.id
      WHERE appointments.user_id = ?
      ORDER BY appointments.appointment_date ASC, appointments.appointment_time ASC
    `).all(req.user.id);

    return res.json(appointments);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.post('/', (req, res) => {
  try {
    const { serviceId, date, time } = req.body;

    if (!serviceId || !date || !time) {
      return res.status(400).json({ error: 'serviceId, date, and time are required.' });
    }

    if (!isValidDateFormat(date)) {
      return res.status(400).json({ error: 'Date must use YYYY-MM-DD format.' });
    }

    if (!isValidTimeFormat(time)) {
      return res.status(400).json({ error: 'Time must use HH:MM format.' });
    }

    if (!isTodayOrFuture(date)) {
      return res.status(400).json({ error: 'Appointment date must be today or in the future.' });
    }

    if (!isWorkingHour(time)) {
      return res.status(400).json({ error: 'Appointment time must be between 09:00 and 17:00.' });
    }

    const service = db.prepare('SELECT id FROM services WHERE id = ?').get(serviceId);

    if (!service) {
      return res.status(404).json({ error: 'Service not found.' });
    }

    const conflict = db.prepare(`
      SELECT * FROM appointments
      WHERE appointment_date = ?
      AND appointment_time = ?
      AND status != 'canceled'
    `).get(date, time);

    if (conflict) {
      return res.status(409).json({ error: 'Appointment time is already booked.' });
    }

    const result = db.prepare(`
      INSERT INTO appointments (user_id, service_id, appointment_date, appointment_time, status)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.user.id, serviceId, date, time, 'pending');

    const appointment = db.prepare(`
      SELECT
        appointments.id,
        appointments.appointment_date,
        appointments.appointment_time,
        appointments.status,
        services.name AS service_name,
        services.duration,
        services.price
      FROM appointments
      JOIN services ON appointments.service_id = services.id
      WHERE appointments.id = ?
    `).get(result.lastInsertRowid);

    return res.status(201).json({
      message: 'Appointment created successfully.',
      appointment
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const appointment = db.prepare(`
      SELECT id, status
      FROM appointments
      WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user.id);

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }

    if (!['pending', 'confirmed'].includes(appointment.status)) {
      return res.status(400).json({ error: 'Only pending or confirmed appointments can be canceled.' });
    }

    db.prepare(`
      UPDATE appointments
      SET status = 'canceled'
      WHERE id = ? AND user_id = ?
    `).run(req.params.id, req.user.id);

    return res.json({ message: 'Appointment canceled successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
