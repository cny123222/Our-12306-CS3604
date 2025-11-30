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
const userInfoRoutes = require('./routes/userInfo');
const paymentRoutes = require('./routes/payment');
const passwordResetRoutes = require('./routes/passwordReset');
const { startCleanupScheduler } = require('./services/pendingOrderCleanupService');
const trainCleanupService = require('./services/trainCleanupService');
const cancellationCleanupService = require('./services/cancellationCleanupService');
const { generateDay15Trains } = require('../database/generate-daily-trains');

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
app.use('/api/user', userInfoRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/password-reset', passwordResetRoutes);

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

/**
 * 启动定时任务调度器
 */
function startScheduledTasks() {
  // 启动pending订单超时清理服务
  startCleanupScheduler();
  
  // 每天凌晨2点清理过期车次
  const cron = require('node-cron');
  cron.schedule('0 2 * * *', async () => {
    console.log('\n执行定时任务：清理过期车次...');
    try {
      const result = await trainCleanupService.cleanupExpiredTrains();
      console.log('清理结果:', result);
    } catch (error) {
      console.error('清理过期车次失败:', error);
    }
  });
  
  // 每天凌晨3点生成第15天的车次数据
  cron.schedule('0 3 * * *', async () => {
    console.log('\n执行定时任务：生成第15天车次数据...');
    try {
      const result = await generateDay15Trains(require('sqlite3').verbose().Database);
      console.log('生成结果:', result);
    } catch (error) {
      console.error('生成车次数据失败:', error);
    }
  });
  
  console.log('定时任务已启动：');
  console.log('  - 每天凌晨2点：清理过期车次');
  console.log('  - 每天凌晨3点：生成第15天车次数据');
}

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    
    // 启动所有定时任务
    startScheduledTasks();
  });
}

module.exports = app;