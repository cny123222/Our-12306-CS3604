/**
 * 修复缺失的座位数据
 * 为所有没有座位状态的车次日期生成座位数据
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database/railway.db');
const db = new sqlite3.Database(dbPath);

/**
 * 查找所有缺失座位数据的车次日期组合
 */
function findMissingSeats() {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT DISTINCT t.train_no, t.departure_date
      FROM trains t
      LEFT JOIN (
        SELECT DISTINCT train_no, departure_date 
        FROM seat_status
      ) s ON t.train_no = s.train_no AND t.departure_date = s.departure_date
      WHERE s.train_no IS NULL
      ORDER BY t.departure_date, t.train_no
    `;
    
    db.all(query, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

/**
 * 为指定车次和日期生成座位数据
 * 从该车次最早有座位数据的日期复制座位配置
 */
function generateSeatsForTrain(trainNo, departureDate) {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO seat_status (
        train_no, departure_date, car_no, seat_no, seat_type, 
        from_station, to_station, status
      ) 
      SELECT 
        ?, ?, car_no, seat_no, seat_type, from_station, to_station, 'available'
      FROM seat_status
      WHERE train_no = ? 
        AND departure_date = (
          SELECT MIN(departure_date) 
          FROM seat_status 
          WHERE train_no = ?
        )
    `;
    
    db.run(query, [trainNo, departureDate, trainNo, trainNo], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.changes);
      }
    });
  });
}

/**
 * 主函数
 */
async function main() {
  console.log('🔍 开始检查缺失的座位数据...\n');
  
  try {
    // 1. 查找所有缺失座位数据的车次
    const missing = await findMissingSeats();
    
    if (missing.length === 0) {
      console.log('✅ 所有车次都有完整的座位数据！');
      db.close();
      return;
    }
    
    console.log(`❌ 找到 ${missing.length} 个缺失座位数据的车次日期组合\n`);
    
    // 按日期分组统计
    const byDate = {};
    missing.forEach(item => {
      if (!byDate[item.departure_date]) {
        byDate[item.departure_date] = [];
      }
      byDate[item.departure_date].push(item.train_no);
    });
    
    console.log('缺失情况：');
    Object.keys(byDate).sort().forEach(date => {
      console.log(`  ${date}: ${byDate[date].length} 个车次 [${byDate[date].join(', ')}]`);
    });
    console.log('');
    
    // 2. 开始生成座位数据
    console.log('🚀 开始生成座位数据...\n');
    
    let successCount = 0;
    let totalSeats = 0;
    
    for (const item of missing) {
      try {
        const changes = await generateSeatsForTrain(item.train_no, item.departure_date);
        successCount++;
        totalSeats += changes;
        
        if (successCount % 10 === 0) {
          console.log(`  已处理 ${successCount}/${missing.length} (${Math.round(successCount/missing.length*100)}%)`);
        }
      } catch (err) {
        console.error(`  ✗ ${item.train_no} ${item.departure_date} 失败:`, err.message);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ 座位数据生成完成！');
    console.log(`📊 统计:`);
    console.log(`   - 处理车次日期组合: ${successCount}/${missing.length}`);
    console.log(`   - 生成座位记录: ${totalSeats.toLocaleString()}`);
    console.log(`   - 平均每个车次: ${Math.round(totalSeats/successCount)} 个座位`);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ 处理失败:', error);
    throw error;
  } finally {
    db.close();
  }
}

// 运行
main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

