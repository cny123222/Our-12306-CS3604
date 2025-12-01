const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../../database/railway.db');

function cleanupOldCancellations() {
  const db = new sqlite3.Database(dbPath);
  const today = new Date().toISOString().split('T')[0];
  
  db.run(
    'DELETE FROM order_cancellations WHERE cancellation_date < ?',
    [today],
    function(err) {
      if (err) {
        console.error('❌ 清理旧取消记录失败:', err);
      } else {
        console.log(`✓ 清理了 ${this.changes} 条旧取消记录`);
      }
      db.close();
    }
  );
}

// 在测试环境下跳过定时任务与启动逻辑，避免干扰测试与产生开放句柄
if (process.env.NODE_ENV !== 'test') {
  // 启动时清理一次
  cleanupOldCancellations();

  // 每天凌晨1点清理
  const now = new Date();
  const tomorrow1AM = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 1, 0, 0);
  const msUntilTomorrow1AM = tomorrow1AM - now;

  setTimeout(() => {
    cleanupOldCancellations();
    // 之后每24小时清理一次
    setInterval(cleanupOldCancellations, 24 * 60 * 60 * 1000);
  }, msUntilTomorrow1AM);

  console.log('✓ 取消记录清理服务已启动');
}

module.exports = { cleanupOldCancellations };

