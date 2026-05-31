const express = require('express');
const db = require('../database');
const { verifyToken, checkRole } = require('../middleware/auth');

const router = express.Router();
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

router.post('/', verifyToken, checkRole('provider'), async (req, res) => {
  try {
    const hours = req.body;

    if (!Array.isArray(hours)) {
      return res.status(400).json({ error: 'Working hours must be an array.' });
    }

    for (const item of hours) {
      const { dayOfWeek, startTime, endTime, slotDuration } = item;

      if (
        !Number.isInteger(Number(dayOfWeek))
        || Number(dayOfWeek) < 0
        || Number(dayOfWeek) > 6
        || !timePattern.test(startTime)
        || !timePattern.test(endTime)
        || startTime >= endTime
        || Number(slotDuration) <= 0
      ) {
        return res.status(400).json({ error: 'One or more working hour entries are invalid.' });
      }

    }

    await db.run('DELETE FROM working_hours WHERE provider_id = ?', [req.user.id]);

    for (const item of hours) {
      const { dayOfWeek, startTime, endTime, slotDuration } = item;
      await db.run(`
        INSERT INTO working_hours (provider_id, day_of_week, start_time, end_time, slot_duration)
        VALUES (?, ?, ?, ?, ?)
      `, [req.user.id, Number(dayOfWeek), startTime, endTime, Number(slotDuration)]);
    }

    return res.json({ message: 'Working hours saved.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.get('/:providerId', async (req, res) => {
  try {
    return res.json(await db.all(`
      SELECT day_of_week, start_time, end_time, slot_duration
      FROM working_hours
      WHERE provider_id = ?
      ORDER BY day_of_week
    `, [req.params.providerId]));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
