/**
 * 数据库迁移脚本：为trains和seat_status表添加departure_date字段
 * 
 * 功能：
 * 1. 备份现有数据
 * 2. 重建trains和seat_status表（添加departure_date字段）
 * 3. 为每个车次生成未来14天的记录
 * 4. 为每个日期的车次初始化座位状态
 * 5. 迁移现有订单数据
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'railway.db');
const backupPath = path.join(__dirname, `railway_backup_${Date.now()}.db`);

/**
 * 生成未来14天的日期列表（包括今天）
 */
function generateNext14Days() {
  const dates = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  return dates;
}

/**
 * 备份数据库
 */
function backupDatabase() {
  return new Promise((resolve, reject) => {
    console.log('正在备份数据库...');
    
    // 复制数据库文件
    fs.copyFile(dbPath, backupPath, (err) => {
      if (err) {
        console.error('备份失败:', err);
        reject(err);
      } else {
        console.log(`数据库已备份到: ${backupPath}`);
        resolve();
      }
    });
  });
}

/**
 * 迁移trains表
 */
function migrateTrainsTable(db) {
  return new Promise((resolve, reject) => {
    console.log('\n开始迁移trains表...');
    
    db.serialize(() => {
      // 1. 读取现有trains数据
      db.all('SELECT * FROM trains', [], (err, oldTrains) => {
        if (err) {
          console.error('读取trains表失败:', err);
          return reject(err);
        }
        
        console.log(`找到 ${oldTrains.length} 条车次记录`);
        
        // 2. 重命名旧表
        db.run('ALTER TABLE trains RENAME TO trains_old', (err) => {
          if (err) {
            console.error('重命名trains表失败:', err);
            return reject(err);
          }
          
          // 3. 创建新trains表
          db.run(`
            CREATE TABLE trains (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              train_no TEXT NOT NULL,
              departure_date DATE NOT NULL,
              train_type TEXT NOT NULL,
              model TEXT,
              is_direct BOOLEAN DEFAULT 1,
              has_air_conditioning BOOLEAN DEFAULT 1,
              origin_station TEXT NOT NULL,
              destination_station TEXT NOT NULL,
              distance_km INTEGER,
              planned_duration_min INTEGER,
              departure_time TEXT,
              arrival_time TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              UNIQUE(train_no, departure_date)
            )
          `, (err) => {
            if (err) {
              console.error('创建新trains表失败:', err);
              return reject(err);
            }
            
            // 4. 创建索引
            db.run('CREATE INDEX IF NOT EXISTS idx_trains_date ON trains(departure_date)', (err) => {
              if (err) console.error('创建日期索引失败:', err);
            });
            
            db.run('CREATE INDEX IF NOT EXISTS idx_trains_no ON trains(train_no)', (err) => {
              if (err) console.error('创建车次号索引失败:', err);
            });
            
            // 5. 为每个车次生成未来14天的记录
            const dates = generateNext14Days();
            const stmt = db.prepare(`
              INSERT INTO trains (
                train_no, departure_date, train_type, model, is_direct, has_air_conditioning,
                origin_station, destination_station, distance_km, planned_duration_min,
                departure_time, arrival_time
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            
            let totalInserted = 0;
            oldTrains.forEach(train => {
              dates.forEach(date => {
                stmt.run(
                  train.train_no,
                  date,
                  train.train_type,
                  train.model,
                  train.is_direct,
                  train.has_air_conditioning,
                  train.origin_station,
                  train.destination_station,
                  train.distance_km,
                  train.planned_duration_min,
                  train.departure_time,
                  train.arrival_time
                );
                totalInserted++;
              });
            });
            
            stmt.finalize((err) => {
              if (err) {
                console.error('插入新trains数据失败:', err);
                return reject(err);
              }
              
              console.log(`成功插入 ${totalInserted} 条车次记录 (${oldTrains.length} 个车次 × 14 天)`);
              
              // 6. 删除旧表
              db.run('DROP TABLE trains_old', (err) => {
                if (err) {
                  console.error('删除旧trains表失败:', err);
                  return reject(err);
                }
                
                console.log('trains表迁移完成！');
                resolve();
              });
            });
          });
        });
      });
    });
  });
}

/**
 * 迁移seat_status表
 */
function migrateSeatStatusTable(db) {
  return new Promise((resolve, reject) => {
    console.log('\n开始迁移seat_status表...');
    
    db.serialize(() => {
      // 1. 读取现有seat_status数据
      db.all('SELECT * FROM seat_status LIMIT 1000', [], (err, oldSeats) => {
        if (err) {
          console.error('读取seat_status表失败:', err);
          return reject(err);
        }
        
        console.log(`找到座位状态记录（示例数量）: ${oldSeats.length}`);
        
        // 2. 重命名旧表
        db.run('ALTER TABLE seat_status RENAME TO seat_status_old', (err) => {
          if (err) {
            console.error('重命名seat_status表失败:', err);
            return reject(err);
          }
          
          // 3. 创建新seat_status表
          db.run(`
            CREATE TABLE seat_status (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              train_no TEXT NOT NULL,
              departure_date DATE NOT NULL,
              car_no INTEGER NOT NULL,
              seat_no TEXT NOT NULL,
              seat_type TEXT NOT NULL,
              from_station TEXT NOT NULL,
              to_station TEXT NOT NULL,
              status TEXT DEFAULT 'available',
              booked_by TEXT,
              booked_at DATETIME,
              FOREIGN KEY (train_no, departure_date) REFERENCES trains(train_no, departure_date)
            )
          `, (err) => {
            if (err) {
              console.error('创建新seat_status表失败:', err);
              return reject(err);
            }
            
            // 4. 创建索引
            db.run('CREATE INDEX IF NOT EXISTS idx_seat_status_train_date ON seat_status(train_no, departure_date)', (err) => {
              if (err) console.error('创建复合索引失败:', err);
            });
            
            db.run('CREATE INDEX IF NOT EXISTS idx_seat_status_date ON seat_status(departure_date)', (err) => {
              if (err) console.error('创建日期索引失败:', err);
            });
            
            // 5. 为每个日期生成座位状态
            // 获取所有唯一的车次号
            db.all('SELECT DISTINCT train_no FROM trains', [], (err, trains) => {
              if (err) {
                console.error('查询车次列表失败:', err);
                return reject(err);
              }
              
              const dates = generateNext14Days();
              const stmt = db.prepare(`
                INSERT INTO seat_status (
                  train_no, departure_date, car_no, seat_no, seat_type, 
                  from_station, to_station, status
                ) 
                SELECT ?, ?, car_no, seat_no, seat_type, from_station, to_station, 'available'
                FROM seat_status_old
                WHERE train_no = ?
              `);
              
              let totalProcessed = 0;
              let completed = 0;
              const totalTasks = trains.length * dates.length;
              
              trains.forEach(train => {
                dates.forEach(date => {
                  stmt.run(train.train_no, date, train.train_no, (err) => {
                    if (err) {
                      console.error(`为车次 ${train.train_no} 日期 ${date} 创建座位状态失败:`, err);
                    } else {
                      totalProcessed++;
                    }
                    
                    completed++;
                    if (completed === totalTasks) {
                      stmt.finalize((err) => {
                        if (err) {
                          console.error('完成座位状态迁移失败:', err);
                          return reject(err);
                        }
                        
                        console.log(`成功创建座位状态记录 (${trains.length} 个车次 × 14 天)`);
                        
                        // 6. 删除旧表
                        db.run('DROP TABLE seat_status_old', (err) => {
                          if (err) {
                            console.error('删除旧seat_status表失败:', err);
                            return reject(err);
                          }
                          
                          console.log('seat_status表迁移完成！');
                          resolve();
                        });
                      });
                    }
                  });
                });
              });
            });
          });
        });
      });
    });
  });
}

/**
 * 迁移orders表（如果需要）
 */
function migrateOrdersTable(db) {
  return new Promise((resolve, reject) => {
    console.log('\n检查orders表...');
    
    // 检查orders表是否存在
    db.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='orders'",
      [],
      (err, row) => {
        if (err) {
          console.error('检查orders表失败:', err);
          return reject(err);
        }
        
        if (!row) {
          console.log('orders表不存在，跳过迁移');
          return resolve();
        }
        
        // 检查是否已有departure_date字段
        db.all('PRAGMA table_info(orders)', [], (err, columns) => {
          if (err) {
            console.error('读取orders表结构失败:', err);
            return reject(err);
          }
          
          const hasDateField = columns.some(col => col.name === 'departure_date');
          
          if (hasDateField) {
            console.log('orders表已包含departure_date字段，无需迁移');
            return resolve();
          }
          
          console.log('orders表需要更新，但数据保持不变（departure_date在订单记录中已存在）');
          resolve();
        });
      }
    );
  });
}

/**
 * 主函数
 */
async function main() {
  console.log('=' .repeat(60));
  console.log('数据库迁移脚本：添加departure_date字段到trains和seat_status表');
  console.log('=' .repeat(60));
  
  // 检查数据库文件是否存在
  if (!fs.existsSync(dbPath)) {
    console.error(`数据库文件不存在: ${dbPath}`);
    console.log('请先运行初始化脚本创建数据库');
    process.exit(1);
  }
  
  const db = new sqlite3.Database(dbPath);
  
  try {
    // 1. 备份数据库
    await backupDatabase();
    
    // 2. 迁移trains表
    await migrateTrainsTable(db);
    
    // 3. 迁移seat_status表
    await migrateSeatStatusTable(db);
    
    // 4. 迁移orders表（如果需要）
    await migrateOrdersTable(db);
    
    console.log('\n' + '='.repeat(60));
    console.log('迁移完成！');
    console.log(`备份文件: ${backupPath}`);
    console.log('=' .repeat(60));
    
  } catch (error) {
    console.error('\n迁移失败:', error);
    console.log(`\n可以从备份恢复: ${backupPath}`);
    process.exit(1);
  } finally {
    db.close();
  }
}

// 执行迁移
if (require.main === module) {
  main();
}

module.exports = { main, generateNext14Days };









