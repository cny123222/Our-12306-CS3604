/**
 * 修复testuser的密码 - 将明文密码加密
 */

const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database/railway.db');
const db = new sqlite3.Database(dbPath);

async function fixTestUserPassword() {
  console.log('🔐 开始修复testuser密码...\n');
  
  try {
    // 原密码
    const plainPassword = 'testpass123';
    
    // 生成bcrypt加密后的密码
    console.log('步骤1: 加密密码...');
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    console.log(`✅ 加密成功: ${hashedPassword}\n`);
    
    // 更新数据库
    console.log('步骤2: 更新数据库...');
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET password = ? WHERE username = ?',
        [hashedPassword, 'testuser'],
        function(err) {
          if (err) {
            reject(err);
          } else {
            console.log(`✅ 更新成功，影响 ${this.changes} 行\n`);
            resolve();
          }
        }
      );
    });
    
    // 验证更新结果
    console.log('步骤3: 验证更新结果...');
    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT username, password FROM users WHERE username = ?',
        ['testuser'],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
    
    console.log('当前密码哈希:', user.password);
    
    // 验证密码是否可以正确比对
    const isValid = await bcrypt.compare(plainPassword, user.password);
    console.log(`密码验证: ${isValid ? '✅ 通过' : '❌ 失败'}\n`);
    
    if (isValid) {
      console.log('='.repeat(60));
      console.log('✅ testuser密码修复成功！');
      console.log('用户名: testuser');
      console.log('密码: testpass123');
      console.log('密码已加密存储，可以正常使用bcrypt验证');
      console.log('='.repeat(60));
    } else {
      throw new Error('密码验证失败，请检查');
    }
    
  } catch (error) {
    console.error('\n❌ 修复失败:', error);
    throw error;
  } finally {
    db.close();
  }
}

fixTestUserPassword();

