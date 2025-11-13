const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'backend', 'database', 'railway.db');
const db = new sqlite3.Database(dbPath);

async function addPassengerForUser() {
  return new Promise((resolve, reject) => {
    // 首先查找用户 od12322
    db.get(`SELECT id FROM users WHERE username = ?`, ['od12322'], (err, user) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (!user) {
        reject(new Error('用户 od12322 未找到'));
        return;
      }
      
      console.log(`找到用户 od12322，用户ID: ${user.id}`);
      
      // 准备乘客数据
      const passengerData = {
        user_id: user.id,
        name: '刘嘉敏',
        id_card: '330106200503104028',
        phone: '13800000000', // 自动生成
        passenger_type: 1, // 1 表示成人
        id_type: 0 // 0 表示身份证
      };
      
      // 插入乘客数据
      const sql = `
        INSERT INTO passengers (user_id, name, id_card, phone, passenger_type, id_type)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      db.run(sql, [
        passengerData.user_id,
        passengerData.name,
        passengerData.id_card,
        passengerData.phone,
        passengerData.passenger_type,
        passengerData.id_type
      ], function(err) {
        if (err) {
          reject(err);
          return;
        }
        
        console.log(`✅ 成功为用户 od12322 添加乘客：`);
        console.log(`   姓名: ${passengerData.name}`);
        console.log(`   身份证号: ${passengerData.id_card}`);
        console.log(`   手机号: ${passengerData.phone}`);
        console.log(`   乘客类型: 成人`);
        console.log(`   证件类型: 身份证`);
        console.log(`   乘客ID: ${this.lastID}`);
        
        // 验证添加结果
        db.all(`SELECT * FROM passengers WHERE user_id = ?`, [user.id], (err, passengers) => {
          if (err) {
            reject(err);
            return;
          }
          
          console.log(`\n用户 od12322 当前的乘客列表（共 ${passengers.length} 人）:`);
          passengers.forEach((p, index) => {
            console.log(`  ${index + 1}. ${p.name} (身份证: ${p.id_card})`);
          });
          
          resolve();
        });
      });
    });
  });
}

// 执行添加操作
addPassengerForUser()
  .then(() => {
    console.log('\n操作完成！');
    db.close();
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 操作失败:', error.message);
    db.close();
    process.exit(1);
  });

