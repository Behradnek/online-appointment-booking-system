const express = require('express');
const db = require('../database');
const { verifyToken, checkRole } = require('../middleware/auth');
const { simulatePayment } = require('../utils/payment');
const { simulateSMS } = require('../utils/sms');

const router = express.Router();
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

function minutesFromTime(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function timeFromMinutes(totalMinutes) {
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const minutes = String(totalMinutes % 60).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function dayOfWeek(date) {
  return (new Date(`${date}T00:00:00`).getDay() + 1) % 7;
}

function validDate(date) {
  return datePattern.test(date) && !Number.isNaN(new Date(`${date}T00:00:00`).getTime());
}

async function getAvailableSlots(providerId, date) {
  const hours = await db.get(`
    SELECT start_time, end_time, slot_duration
    FROM working_hours
    WHERE provider_id = ? AND day_of_week = ?
  `, [providerId, dayOfWeek(date)]);

  if (!hours) {
    return [];
  }

  const appointments = await db.all(`
    SELECT appointment_time
    FROM appointments
    WHERE provider_id = ?
      AND appointment_date = ?
      AND status IN ('pending', 'confirmed')
  `, [providerId, date]);

  const bookedTimes = new Set(appointments.map((appointment) => appointment.appointment_time));
  const slots = [];

  for (
    let minutes = minutesFromTime(hours.start_time);
    minutes + hours.slot_duration <= minutesFromTime(hours.end_time);
    minutes += hours.slot_duration
  ) {
    const time = timeFromMinutes(minutes);
    if (!bookedTimes.has(time)) {
      slots.push(time);
    }
  }

  return slots;
}

router.get('/available-slots', async (req, res) => {
  try {
    const { providerId, date } = req.query;

    if (!providerId || !validDate(date)) {
      return res.status(400).json({ error: 'providerId and a valid date are required.' });
    }

    return res.json(await getAvailableSlots(providerId, date));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.post('/simulate-payment', verifyToken, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'A valid payment amount is required.' });
    }

    return res.json(await simulatePayment(amount));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.post('/appointments', verifyToken, checkRole('user'), async (req, res) => {
  try {
    const {
      providerId,
      serviceId,
      date,
      time,
      guestName,
      guestFamily,
      guestPhone,
      guestNationalCode
    } = req.body;

    if (
      !providerId || !serviceId || !validDate(date) || !timePattern.test(time)
      || !guestName || !guestFamily || !guestPhone || !guestNationalCode
    ) {
      return res.status(400).json({ error: 'All appointment fields are required and must be valid.' });
    }

    if (new Date(`${date}T${time}:00`) <= new Date()) {
      return res.status(400).json({ error: 'Appointment time must be in the future.' });
    }

    const offering = await db.get(`
      SELECT provider_services.price
      FROM provider_services
      JOIN users ON users.id = provider_services.provider_id
      WHERE provider_services.provider_id = ?
        AND provider_services.service_id = ?
        AND provider_services.is_active = 1
        AND users.is_active = 1
    `, [providerId, serviceId]);

    if (!offering) {
      return res.status(404).json({ error: 'Provider does not offer this service.' });
    }

    const slots = await getAvailableSlots(providerId, date);
    if (!slots.includes(time)) {
      return res.status(409).json({ error: 'Selected appointment slot is no longer available.' });
    }

    const payment = await simulatePayment(offering.price);
    const result = await db.run(`
      INSERT INTO appointments (
        user_id, provider_id, service_id,
        guest_name, guest_family, guest_phone, guest_national_code,
        appointment_date, appointment_time, status, payment_status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `, [
      req.user.id,
      providerId,
      serviceId,
      guestName,
      guestFamily,
      guestPhone,
      guestNationalCode,
      date,
      time,
      payment.success ? 'paid' : 'unpaid'
    ]);

    await simulateSMS(
      guestPhone,
      `نوبت شما برای تاریخ ${date} ساعت ${time} ثبت شد.`,
      'confirmation'
    );

    return res.status(201).json({
      message: 'Appointment booked and simulated payment completed.',
      id: result.id,
      payment
    });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      return res.status(409).json({ error: 'Selected appointment slot is no longer available.' });
    }
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.get('/appointments/my', verifyToken, async (req, res) => {
  try {
    return res.json(await db.all(`
      SELECT
        appointments.*,
        services.name AS service_name,
        services.base_price,
        providers.name AS provider_name,
        providers.family AS provider_family,
        COALESCE(cancellation_policies.min_hours_before, 24) AS min_hours_before,
        COALESCE(cancellation_policies.enable_penalty, 0) AS enable_penalty,
        cancellation_policies.description AS cancellation_description
      FROM appointments
      JOIN services ON services.id = appointments.service_id
      JOIN users AS providers ON providers.id = appointments.provider_id
      LEFT JOIN cancellation_policies ON cancellation_policies.provider_id = appointments.provider_id
      WHERE appointments.user_id = ?
      ORDER BY appointments.appointment_date DESC, appointments.appointment_time DESC
    `, [req.user.id]));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.delete('/appointments/:id', verifyToken, checkRole('user'), async (req, res) => {
  try {
    const appointment = await db.get(`
      SELECT
        appointments.*,
        COALESCE(cancellation_policies.min_hours_before, 24) AS min_hours_before,
        COALESCE(cancellation_policies.enable_penalty, 0) AS enable_penalty
      FROM appointments
      LEFT JOIN cancellation_policies ON cancellation_policies.provider_id = appointments.provider_id
      WHERE appointments.id = ? AND appointments.user_id = ?
    `, [req.params.id, req.user.id]);

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }

    if (!['pending', 'confirmed'].includes(appointment.status)) {
      return res.status(400).json({ error: 'This appointment cannot be canceled.' });
    }

    const appointmentDate = new Date(`${appointment.appointment_date}T${appointment.appointment_time}:00`);
    const hoursUntilAppointment = (appointmentDate.getTime() - Date.now()) / (1000 * 60 * 60);

    if (hoursUntilAppointment < appointment.min_hours_before) {
      return res.status(400).json({
        error: `This appointment can only be canceled at least ${appointment.min_hours_before} hours in advance.`
      });
    }

    const paymentStatus = appointment.enable_penalty ? appointment.payment_status : 'refunded';
    await db.run(`
      UPDATE appointments
      SET status = 'canceled', payment_status = ?
      WHERE id = ?
    `, [paymentStatus, appointment.id]);

    await simulateSMS(
      appointment.guest_phone,
      `نوبت شما برای تاریخ ${appointment.appointment_date} لغو شد.`,
      'cancellation'
    );

    return res.json({
      message: 'Appointment canceled.',
      payment_status: paymentStatus
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
