/**
 * 为G27车次生成座位数据
 * 使用G16的座位配置作为模板（同样是京沪高铁）
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database/railway.db');
const db = new sqlite3.Database(dbPath);

// G27缺少座位数据的日期
const missingDates = [
  '2025-11-23',
  '2025-11-24',
  '2025-11-25',
  '2025-11-26',
  '2025-11-27'
];

async function generateG27Seats() {
  console.log('🚄 开始为G27生成座位数据...\n');
  
  for (const date of missingDates) {
    await new Promise((resolve, reject) => {
      const query = `
        INSERT INTO seat_status (
          train_no, departure_date, car_no, seat_no, seat_type, 
          from_station, to_station, status
        ) 
        SELECT 
          'G27', ?, car_no, seat_no, seat_type, from_station, to_station, 'available'
        FROM seat_status
        WHERE train_no = 'G16' AND departure_date = '2025-11-14'
      `;
      
      db.run(query, [date], function(err) {
        if (err) {
          console.error(`  ✗ ${date} 失败:`, err.message);
          reject(err);
        } else {
          console.log(`  ✓ ${date}: 生成 ${this.changes} 条座位记录`);
          resolve();
        }
      });
    });
  }
  
  console.log('\n✅ G27座位数据生成完成！');
}

generateG27Seats()
  .then(() => db.close())
  .catch(err => {
    console.error('❌ 失败:', err);
    db.close();
    process.exit(1);
  });

