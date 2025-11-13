const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const registerRoutes = require('./routes/register');
const stationsRoutes = require('./routes/stations');
const trainsRoutes = require('./routes/trains');
const ticketsRoutes = require('./routes/tickets');
const ordersRoutes = require('./routes/orders');
const passengersRoutes = require('./routes/passengers');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/register', registerRoutes);
app.use('/api/terms', registerRoutes);
app.use('/api/stations', stationsRoutes);
app.use('/api/trains', trainsRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/passengers', passengersRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;