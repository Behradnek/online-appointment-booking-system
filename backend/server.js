require('dotenv').config();

const cors = require('cors');
const express = require('express');
const db = require('./database');

const authRoutes = require('./routes/auth');
const servicesRoutes = require('./routes/services');
const serviceRequestRoutes = require('./routes/service-requests');
const workingHourRoutes = require('./routes/working-hours');
const appointmentRoutes = require('./routes/appointments');
const providerRoutes = require('./routes/provider');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({ message: 'NobatYab API is running.' });
});

app.use('/api', authRoutes);
app.use('/api', servicesRoutes);
app.use('/api/service-requests', serviceRequestRoutes);
app.use('/api/working-hours', workingHourRoutes);
app.use('/api', appointmentRoutes);
app.use('/api/provider', providerRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: 'Internal server error.' });
});

db.ready
  .then(() => {
    app.listen(PORT, () => {
      console.log(`NobatYab API is running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Database initialization failed:', error);
    process.exit(1);
  });
