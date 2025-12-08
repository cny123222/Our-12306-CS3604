const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.NODE_ENV === 'test'
  ? (process.env.TEST_DB_PATH || path.resolve(__dirname, '../../test/test.db'))
  : (process.env.DB_PATH || path.resolve(__dirname, '../../database/railway.db'));

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

if (process.env.NODE_ENV !== 'test') {
  cleanupOldCancellations();
  const now = new Date();
  const tomorrow1AM = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 1, 0, 0);
  const msUntilTomorrow1AM = tomorrow1AM - now;
  const timeoutHandle = setTimeout(() => {
    cleanupOldCancellations();
    const intervalHandle = setInterval(cleanupOldCancellations, 24 * 60 * 60 * 1000);
    if (intervalHandle.unref) intervalHandle.unref();
  }, msUntilTomorrow1AM);
  if (timeoutHandle.unref) timeoutHandle.unref();
  console.log('✓ 取消记录清理服务已启动');
}

module.exports = { cleanupOldCancellations };
