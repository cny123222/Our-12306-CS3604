import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import stationRoutes from './routes/stations.js';
import ticketRoutes from './routes/tickets.js';
import authRoutes from './routes/auth.js';
import trainRoutes from './routes/trains.js';
import orderRoutes from './routes/orders.js';
import passengerRoutes from './routes/passengers.js';
import registerRoutes from './routes/register.js';

// Load environment variables
dotenv.config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env' });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ 
  origin: process.env.CORS_ORIGIN || ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true 
}));
app.use(express.json());

// Routes
app.use('/api/stations', stationRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/trains', trainRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/passengers', passengerRoutes);
app.use('/api/register', registerRoutes);
app.use('/api/terms', registerRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server only if not in test environment
let server;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export { app, server };

